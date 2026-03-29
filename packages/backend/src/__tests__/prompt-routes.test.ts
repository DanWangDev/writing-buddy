import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { createPromptRouter } from '../routes/prompts.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { setAuthMiddleware } from '../middleware/auth.js'

/** Injects req.user with given role for testing requireAdmin */
function injectUser(role: string, apps: string[] = ['writing-buddy']) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      sub: '1',
      email: 'admin@test.com',
      username: 'admin',
      display_name: 'Admin User',
      email_verified: true,
      role,
      plan: 'pro',
      features: [],
      apps,
      expires_at: null,
    }
    next()
  }
}

function buildTestApp(db: DatabaseType, role = 'student') {
  // Set up auth middleware so requireAdmin can read req.user
  setAuthMiddleware(
    injectUser(role),
    (req: Request, _res: Response, next: NextFunction) => { next() }
  )
  const app = express()
  app.use(express.json())
  // Inject user before routes (simulates requireAuth having run)
  app.use(injectUser(role))
  app.use('/api/writing/prompts', createPromptRouter(db))
  return app
}

describe('Prompt Routes', () => {
  let db: DatabaseType
  let app: express.Express

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    app = buildTestApp(db)

    const repo = new SqlitePromptRepository(db)
    repo.create({ title: 'Adventure One', body: 'Go explore.', genre: 'adventure', difficulty: 'beginner', tags: ['explore'] })
    repo.create({ title: 'Mystery Two', body: 'Solve it.', genre: 'mystery', difficulty: 'standard', tags: ['clue'] })
    repo.create({ title: 'Fantasy Three', body: 'Cast a spell.', genre: 'fantasy', difficulty: 'challenge', tags: ['magic'] })
  })

  afterEach(() => {
    db.close()
  })

  describe('GET /api/writing/prompts', () => {
    it('returns all prompts', async () => {
      const res = await request(app).get('/api/writing/prompts')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(3)
      expect(res.body.meta.total).toBe(3)
    })

    it('filters by genre', async () => {
      const res = await request(app).get('/api/writing/prompts?genre=mystery')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].genre).toBe('mystery')
    })

    it('filters by difficulty', async () => {
      const res = await request(app).get('/api/writing/prompts?difficulty=challenge')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].difficulty).toBe('challenge')
    })

    it('returns empty array for no matches', async () => {
      const res = await request(app).get('/api/writing/prompts?genre=humor')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
      expect(res.body.meta.total).toBe(0)
    })
  })

  describe('GET /api/writing/prompts/:id', () => {
    it('returns a single prompt by id', async () => {
      const listRes = await request(app).get('/api/writing/prompts')
      const promptId = listRes.body.data[0].id

      const res = await request(app).get(`/api/writing/prompts/${promptId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(promptId)
    })

    it('returns 404 for nonexistent prompt', async () => {
      const res = await request(app).get('/api/writing/prompts/nonexistent-id')

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  describe('Admin CRUD — POST/PUT/DELETE', () => {
    let adminApp: express.Express
    let adminDb: DatabaseType

    beforeEach(() => {
      adminDb = new Database(':memory:')
      adminDb.pragma('foreign_keys = ON')
      const migrator = new Migrator(adminDb, migrations)
      migrator.migrate()
      adminApp = buildTestApp(adminDb, 'admin')

      const repo = new SqlitePromptRepository(adminDb)
      repo.create({ title: 'Seed Prompt', body: 'A seed prompt for testing.', genre: 'adventure', difficulty: 'beginner', tags: ['seed'] })
    })

    afterEach(() => {
      adminDb.close()
    })

    it('POST / creates a prompt as admin', async () => {
      const res = await request(adminApp)
        .post('/api/writing/prompts')
        .send({
          title: 'New Admin Prompt',
          body: 'This is a new prompt body.',
          genre: 'mystery',
          difficulty: 'standard',
          tags: ['test', 'admin'],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('New Admin Prompt')
      expect(res.body.data.id).toBeDefined()
    })

    it('POST / returns 400 for invalid data', async () => {
      const res = await request(adminApp)
        .post('/api/writing/prompts')
        .send({ title: 'AB', body: 'Short', genre: 'mystery', difficulty: 'standard', tags: [] })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('PUT /:id updates a prompt as admin', async () => {
      const listRes = await request(adminApp).get('/api/writing/prompts')
      const promptId = listRes.body.data[0].id

      const res = await request(adminApp)
        .put(`/api/writing/prompts/${promptId}`)
        .send({ title: 'Updated Title' })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Updated Title')
    })

    it('PUT /:id returns 404 for nonexistent prompt', async () => {
      const res = await request(adminApp)
        .put('/api/writing/prompts/nonexistent')
        .send({ title: 'Nope' })

      expect(res.status).toBe(404)
    })

    it('DELETE /:id soft-deletes a prompt as admin', async () => {
      const listRes = await request(adminApp).get('/api/writing/prompts')
      const promptId = listRes.body.data[0].id

      const res = await request(adminApp).delete(`/api/writing/prompts/${promptId}`)
      expect(res.status).toBe(204)

      // Should not appear in list
      const afterList = await request(adminApp).get('/api/writing/prompts')
      expect(afterList.body.data.find((p: { id: string }) => p.id === promptId)).toBeUndefined()
    })

    it('GET /stats returns heatmap and submission counts', async () => {
      const res = await request(adminApp).get('/api/writing/prompts/stats')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data.heatmap)).toBe(true)
      expect(typeof res.body.data.submissionCounts).toBe('object')
    })
  })

  describe('Admin routes — student gets 403', () => {
    let studentApp: express.Express
    let studentDb: DatabaseType

    beforeEach(() => {
      studentDb = new Database(':memory:')
      studentDb.pragma('foreign_keys = ON')
      const migrator = new Migrator(studentDb, migrations)
      migrator.migrate()
      studentApp = buildTestApp(studentDb, 'student')
    })

    afterEach(() => {
      studentDb.close()
    })

    it('POST / returns 403 for student', async () => {
      const res = await request(studentApp)
        .post('/api/writing/prompts')
        .send({ title: 'Test', body: 'Test body content here.', genre: 'mystery', difficulty: 'standard', tags: ['t'] })

      expect(res.status).toBe(403)
    })

    it('PUT /:id returns 403 for student', async () => {
      const res = await request(studentApp)
        .put('/api/writing/prompts/some-id')
        .send({ title: 'Test' })

      expect(res.status).toBe(403)
    })

    it('DELETE /:id returns 403 for student', async () => {
      const res = await request(studentApp).delete('/api/writing/prompts/some-id')

      expect(res.status).toBe(403)
    })

    it('GET /stats returns 403 for student', async () => {
      const res = await request(studentApp).get('/api/writing/prompts/stats')

      expect(res.status).toBe(403)
    })
  })
})
