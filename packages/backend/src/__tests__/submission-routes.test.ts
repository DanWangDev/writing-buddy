import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { z } from 'zod'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { AuthService } from '../services/auth-service.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'

async function registerAndGetToken(
  authService: AuthService,
  email: string = 'writer@example.com'
): Promise<string> {
  const { tokens } = await authService.register(email, 'Writer', 'password123', 'student')
  return tokens.accessToken
}

function buildTestApp(db: DatabaseType) {
  const authService = new AuthService(db)
  const submissionRepo = new SqliteSubmissionRepository(db)
  const revisionRepo = new SqliteRevisionRepository(db)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())

  function testAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.slice(7)
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }
    try {
      const payload = authService.verifyAccessToken(token)
      req.user = payload
      next()
    } catch {
      res.status(401).json({ success: false, error: 'Invalid token' })
    }
  }

  const router = express.Router()

  router.post('/', testAuth, (req: Request, res: Response) => {
    try {
      const schema = z.object({ promptId: z.string().uuid().optional() })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors.map(e => e.message).join(', ') })
        return
      }
      const submission = submissionRepo.create(req.user!.sub, parsed.data.promptId)
      res.status(201).json({ success: true, data: submission })
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.get('/', testAuth, (req: Request, res: Response) => {
    try {
      const schema = z.object({ status: z.enum(['draft', 'in_coaching', 'completed']).optional() })
      const parsed = schema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid query' })
        return
      }
      const submissions = submissionRepo.findByUserId(req.user!.sub, parsed.data)
      res.json({ success: true, data: submissions })
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.get('/:id', testAuth, (req: Request, res: Response) => {
    try {
      const submission = submissionRepo.findById(req.params.id)
      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }
      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }
      const revisions = revisionRepo.findBySubmissionId(req.params.id)
      res.json({ success: true, data: { ...submission, revisions } })
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.post('/:id/revisions', testAuth, (req: Request, res: Response) => {
    try {
      const submission = submissionRepo.findById(req.params.id)
      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }
      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }
      const schema = z.object({ content: z.string().min(1, 'Content is required') })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors.map(e => e.message).join(', ') })
        return
      }
      const { content } = parsed.data
      const existingCount = revisionRepo.countBySubmissionId(req.params.id)
      const wordCount = content.split(/\s+/).filter(t => t.length > 0).length
      if (existingCount === 0 && wordCount < 50) {
        res.status(400).json({
          success: false,
          error: `Your first draft needs at least 50 words. You have ${wordCount} so far. Keep going!`,
        })
        return
      }
      const revision = revisionRepo.create(req.params.id, content)
      res.status(201).json({ success: true, data: revision })
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.patch('/:id/complete', testAuth, (req: Request, res: Response) => {
    try {
      const submission = submissionRepo.findById(req.params.id)
      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }
      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }
      if (submission.status === 'completed') {
        res.status(400).json({ success: false, error: 'Submission is already completed' })
        return
      }
      const revisionCount = revisionRepo.countBySubmissionId(req.params.id)
      const xpEarned = 10 + (revisionCount * 5)
      const completed = submissionRepo.complete(req.params.id, xpEarned)
      res.json({ success: true, data: completed })
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  app.use('/api/writing/submissions', router)
  return app
}

describe('Submission Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let authService: AuthService
  let token: string
  let promptId: string

  beforeEach(async () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    authService = new AuthService(db)
    app = buildTestApp(db)
    token = await registerAndGetToken(authService)

    const promptRepo = new SqlitePromptRepository(db)
    const prompt = promptRepo.create({
      title: 'Test Prompt',
      body: 'Write something great.',
      genre: 'adventure',
      difficulty: 'beginner',
      tags: [],
    })
    promptId = prompt.id
  })

  afterEach(() => {
    db.close()
  })

  describe('POST /api/writing/submissions', () => {
    it('creates a submission with auth', async () => {
      const res = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({ promptId })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.promptId).toBe(promptId)
      expect(res.body.data.status).toBe('draft')
    })

    it('creates a submission without a prompt', async () => {
      const res = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      expect(res.status).toBe(201)
      expect(res.body.data.promptId).toBeUndefined()
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/writing/submissions')
        .send({ promptId })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/writing/submissions', () => {
    it('lists user submissions', async () => {
      await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const res = await request(app)
        .get('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
    })
  })

  describe('GET /api/writing/submissions/:id', () => {
    it('returns submission with revisions', async () => {
      const createRes = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const subId = createRes.body.data.id

      const res = await request(app)
        .get(`/api/writing/submissions/${subId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(subId)
      expect(res.body.data.revisions).toEqual([])
    })

    it('returns 404 for nonexistent submission', async () => {
      const res = await request(app)
        .get('/api/writing/submissions/nonexistent')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/writing/submissions/:id/revisions', () => {
    it('creates a revision with enough words', async () => {
      const createRes = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const subId = createRes.body.data.id
      const longContent = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')

      const res = await request(app)
        .post(`/api/writing/submissions/${subId}/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: longContent })

      expect(res.status).toBe(201)
      expect(res.body.data.revisionNumber).toBe(1)
      expect(res.body.data.wordCount).toBe(60)
    })

    it('rejects first revision with fewer than 50 words', async () => {
      const createRes = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const subId = createRes.body.data.id

      const res = await request(app)
        .post(`/api/writing/submissions/${subId}/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Too short.' })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('at least 50 words')
    })
  })

  describe('PATCH /api/writing/submissions/:id/complete', () => {
    it('marks submission as complete with XP', async () => {
      const createRes = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const subId = createRes.body.data.id
      const content = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')

      await request(app)
        .post(`/api/writing/submissions/${subId}/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content })

      const res = await request(app)
        .patch(`/api/writing/submissions/${subId}/complete`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('completed')
      expect(res.body.data.xpEarned).toBe(15)
      expect(res.body.data.completedAt).toBeDefined()
    })

    it('returns 400 if already completed', async () => {
      const createRes = await request(app)
        .post('/api/writing/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({})

      const subId = createRes.body.data.id
      const content = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')

      await request(app)
        .post(`/api/writing/submissions/${subId}/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content })

      await request(app)
        .patch(`/api/writing/submissions/${subId}/complete`)
        .set('Authorization', `Bearer ${token}`)

      const res = await request(app)
        .patch(`/api/writing/submissions/${subId}/complete`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('already completed')
    })
  })
})
