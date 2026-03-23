import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { createPromptRouter } from '../routes/prompts.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'

function buildTestApp(db: DatabaseType) {
  const app = express()
  app.use(express.json())
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
})
