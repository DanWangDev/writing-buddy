import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { AuthService } from '../services/auth-service.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { createCoachingRouter } from '../routes/coaching.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from '../services/llm/provider.js'

class MockLLMProvider implements LLMProvider {
  async generateResponse(
    _systemPrompt: string,
    _userPrompt: string,
    _options: LLMProviderOptions
  ): Promise<LLMResponse> {
    return {
      content: 'Wonderful writing! I loved the vivid descriptions.',
      tokensUsed: 150,
      model: 'mock-model',
    }
  }
}

async function registerAndGetToken(
  authService: AuthService,
  email: string = 'writer@example.com'
): Promise<string> {
  const { tokens } = await authService.register(email, 'Writer', 'password123', 'student')
  return tokens.accessToken
}

function buildTestApp(db: DatabaseType, llmProvider: LLMProvider) {
  const authService = new AuthService(db)

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

  // Monkey-patch requireAuth for tests
  const coachingRouter = createCoachingRouter(db, llmProvider)

  // We need to mount using our own auth middleware
  const testRouter = express.Router()

  testRouter.post('/:id/coach', testAuth, async (req: Request, res: Response, next: NextFunction) => {
    // Forward to coaching router
    next()
  })
  testRouter.get('/:id/coaching', testAuth, (req: Request, res: Response, next: NextFunction) => {
    next()
  })

  app.use('/api/writing/submissions', coachingRouter)

  return { app, authService }
}

describe('Coaching Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let authService: AuthService
  let token: string
  let submissionId: string
  let mockLLM: MockLLMProvider

  beforeEach(async () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    mockLLM = new MockLLMProvider()
    const built = buildTestApp(db, mockLLM)
    app = built.app
    authService = built.authService

    token = await registerAndGetToken(authService)

    // Decode token to get userId
    const payload = authService.verifyAccessToken(token)
    const userId = payload.sub

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(userId)
    submissionId = submission.id

    const revisionRepo = new SqliteRevisionRepository(db)
    revisionRepo.create(
      submissionId,
      'The brave knight rode through the dark forest searching for the lost treasure. The trees whispered secrets as the wind blew through their ancient branches. She knew this quest would change everything.'
    )
  })

  describe('POST /api/writing/submissions/:id/coach', () => {
    it('creates a coaching pass and returns 201', async () => {
      const res = await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.passType).toBe('acknowledgment')
      expect(res.body.data.feedback).toBe('Wonderful writing! I loved the vivid descriptions.')
    })

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)

      expect(res.status).toBe(401)
    })

    it('returns 404 for nonexistent submission', async () => {
      const res = await request(app)
        .post(`/api/writing/submissions/nonexistent/coach`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })

    it('returns 403 for submission owned by another user', async () => {
      const otherToken = await registerAndGetToken(authService, 'other@example.com')

      const res = await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/writing/submissions/:id/coaching', () => {
    it('returns coaching passes for a submission', async () => {
      // First create a coaching pass
      await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)
        .set('Authorization', `Bearer ${token}`)

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].passType).toBe('acknowledgment')
    })

    it('returns empty array when no passes exist', async () => {
      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('returns 403 for submission owned by another user', async () => {
      const otherToken = await registerAndGetToken(authService, 'other2@example.com')

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })
  })
})
