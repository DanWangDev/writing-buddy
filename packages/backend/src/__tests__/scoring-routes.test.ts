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
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { createScoringRouter } from '../routes/scoring.js'

async function registerAndGetToken(
  authService: AuthService,
  email: string = 'scorer@example.com'
): Promise<string> {
  const { tokens } = await authService.register(email, 'Scorer', 'password123', 'student')
  return tokens.accessToken
}

function buildTestApp(db: DatabaseType) {
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

  const scoringRouter = createScoringRouter(db)
  app.use('/api/writing/submissions', scoringRouter)

  return { app, authService }
}

describe('Scoring Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let authService: AuthService
  let token: string
  let submissionId: string
  let userId: string

  beforeEach(async () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    const built = buildTestApp(db)
    app = built.app
    authService = built.authService

    token = await registerAndGetToken(authService)

    const payload = authService.verifyAccessToken(token)
    userId = payload.sub

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(userId)
    submissionId = submission.id
  })

  describe('GET /api/writing/submissions/:id/scores', () => {
    it('returns scores when they exist', async () => {
      const rubricScoresRepo = new SqliteRubricScoresRepository(db)
      rubricScoresRepo.create({
        submissionId,
        content: 8,
        organization: 7,
        vocabulary: 6,
        grammar: 9,
        spelling: 8,
        overallScore: 38,
        status: 'scored',
        llmModel: 'test-model',
        llmTokensUsed: 50,
      })

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/scores`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.content).toBe(8)
      expect(res.body.data.status).toBe('scored')
    })

    it('returns 404 when scores do not exist', async () => {
      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/scores`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toContain('not yet available')
    })

    it('returns 404 for nonexistent submission', async () => {
      const res = await request(app)
        .get('/api/writing/submissions/nonexistent/scores')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })

    it('returns 403 for submission owned by another user', async () => {
      const otherToken = await registerAndGetToken(authService, 'other@example.com')

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/scores`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/scores`)

      expect(res.status).toBe(401)
    })
  })
})
