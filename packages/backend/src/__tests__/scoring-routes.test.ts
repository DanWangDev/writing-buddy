import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { createTestToken, initTestAuth } from './test-auth-helper.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { createScoringRouter } from '../routes/scoring.js'

function buildTestApp(db: DatabaseType) {
  initTestAuth(db)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())

  const scoringRouter = createScoringRouter(db)
  app.use('/api/writing/submissions', scoringRouter)

  return app
}

describe('Scoring Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let token: string
  let submissionId: string
  const userId = '1'

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    app = buildTestApp(db)

    const testUser = createTestToken({ sub: userId, email: 'scorer@example.com', displayName: 'Scorer' })
    token = testUser.token

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(userId)
    submissionId = submission.id
  })

  afterEach(() => {
    db.close()
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
      const { token: otherToken } = createTestToken({ sub: '2', email: 'other@example.com', displayName: 'Other' })

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
