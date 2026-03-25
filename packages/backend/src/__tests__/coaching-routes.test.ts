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
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
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

function buildTestApp(db: DatabaseType, llmProvider: LLMProvider) {
  initTestAuth(db)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())

  const coachingRouter = createCoachingRouter(db, llmProvider)
  app.use('/api/writing/submissions', coachingRouter)

  return app
}

describe('Coaching Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let token: string
  let submissionId: string
  let mockLLM: MockLLMProvider

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    mockLLM = new MockLLMProvider()
    app = buildTestApp(db, mockLLM)

    const testUser = createTestToken({ sub: '1', email: 'writer@example.com', displayName: 'Writer' })
    token = testUser.token

    // Create an app_users record so the coaching service can find the user
    const appUserRepo = new SqliteAppUserRepository(db)
    appUserRepo.upsert('1', 'Writer', 'writer@example.com', 'student')

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create('1')
    submissionId = submission.id

    const revisionRepo = new SqliteRevisionRepository(db)
    revisionRepo.create(
      submissionId,
      'The brave knight rode through the dark forest searching for the lost treasure. The trees whispered secrets as the wind blew through their ancient branches. She knew this quest would change everything.'
    )
  })

  afterEach(() => {
    db.close()
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
      const { token: otherToken } = createTestToken({ sub: '2', email: 'other@example.com', displayName: 'Other' })

      const res = await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/writing/submissions/:id/coaching', () => {
    it('returns coaching passes for a submission', async () => {
      await request(app)
        .post(`/api/writing/submissions/${submissionId}/coach`)
        .set('Authorization', `Bearer ${token}`)

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.passes).toHaveLength(1)
      expect(res.body.data.passes[0].passType).toBe('acknowledgment')
      expect(res.body.data.currentPass).toBe(1)
      expect(res.body.data.isComplete).toBe(false)
      expect(res.body.data.submissionId).toBe(submissionId)
    })

    it('returns empty array when no passes exist', async () => {
      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({
        submissionId,
        currentPass: 0,
        passes: [],
        isComplete: false,
      })
    })

    it('returns 403 for submission owned by another user', async () => {
      const { token: otherToken } = createTestToken({ sub: '2', email: 'other2@example.com', displayName: 'Other' })

      const res = await request(app)
        .get(`/api/writing/submissions/${submissionId}/coaching`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })
  })
})
