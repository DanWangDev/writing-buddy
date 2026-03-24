import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { createTestToken, createExpiredTestToken, initTestAuth } from './test-auth-helper.js'
import { createMeRouter } from '../routes/me.js'

function buildTestApp(db: DatabaseType) {
  initTestAuth(db)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/writing/auth', createMeRouter(db))
  return app
}

describe('Auth Routes (Hub Auth)', () => {
  let db: DatabaseType
  let app: express.Express

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    app = buildTestApp(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('GET /api/writing/auth/me', () => {
    it('returns user claims from valid hub JWT', async () => {
      const { token } = createTestToken({
        email: 'me@example.com',
        displayName: 'Me User',
        plan: 'writing',
      })

      const res = await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe('me@example.com')
      expect(res.body.data.displayName).toBe('Me User')
      expect(res.body.data.plan).toBe('writing')
      // Should not expose any password-related fields
      expect(res.body.data.passwordHash).toBeUndefined()
    })

    it('returns 401 without token', async () => {
      const res = await request(app)
        .get('/api/writing/auth/me')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('returns 401 for expired token', async () => {
      const token = createExpiredTestToken()

      const res = await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(401)
    })

    it('returns 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', 'Bearer invalid-token-string')

      expect(res.status).toBe(401)
    })

    it('creates app_users record on first visit (lazy sync)', async () => {
      const { token } = createTestToken({
        sub: '42',
        email: 'new@example.com',
        displayName: 'New Hub User',
      })

      await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${token}`)

      const row = db.prepare('SELECT * FROM app_users WHERE hub_user_id = ?').get('42') as {
        hub_user_id: string
        display_name: string
        email: string
      }
      expect(row).toBeDefined()
      expect(row.display_name).toBe('New Hub User')
      expect(row.email).toBe('new@example.com')
    })

    it('updates app_users on subsequent visits', async () => {
      const { token: token1 } = createTestToken({
        sub: '42',
        email: 'user@example.com',
        displayName: 'Original Name',
      })

      await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${token1}`)

      const { token: token2 } = createTestToken({
        sub: '42',
        email: 'user@example.com',
        displayName: 'Updated Name',
      })

      await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${token2}`)

      const row = db.prepare('SELECT * FROM app_users WHERE hub_user_id = ?').get('42') as {
        display_name: string
      }
      expect(row.display_name).toBe('Updated Name')
    })
  })
})
