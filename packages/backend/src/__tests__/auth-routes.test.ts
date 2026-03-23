import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { AuthService } from '../services/auth-service.js'

/*
  These tests create a standalone Express app wired to an in-memory DB
  so they are fully isolated from the real application database.
*/

function buildTestApp(db: DatabaseType) {
  /* We dynamically build the auth router using the provided db instance
     instead of the module-level singleton. To do this we inline the route
     logic with a shared AuthService. */

  const { Router } = express
  const router = Router()
  const authService = new AuthService(db)

  // Inline helper
  function toPublic(u: { id: string; email: string; displayName: string; role: string; subscriptionPlan: string; createdAt: string }) {
    return { id: u.id, email: u.email, displayName: u.displayName, role: u.role, subscriptionPlan: u.subscriptionPlan, createdAt: u.createdAt }
  }

  router.post('/register', async (req, res) => {
    try {
      const { email, displayName, password, role, parentId } = req.body
      const { user, tokens } = await authService.register(email, displayName, password, role, parentId)
      res.status(201).json({ success: true, data: { user: toPublic(user), ...tokens } })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Internal server error'
      if (msg === 'Email already registered') {
        res.status(409).json({ success: false, error: msg })
        return
      }
      res.status(400).json({ success: false, error: msg })
    }
  })

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      const { user, tokens } = await authService.login(email, password)
      res.json({ success: true, data: { user: toPublic(user), ...tokens } })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Internal server error'
      res.status(401).json({ success: false, error: msg })
    }
  })

  router.post('/refresh', (req, res) => {
    try {
      const { refreshToken } = req.body
      const { user, tokens } = authService.refreshToken(refreshToken)
      res.json({ success: true, data: { user: toPublic(user), ...tokens } })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Internal server error'
      res.status(401).json({ success: false, error: msg })
    }
  })

  router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.slice(7)
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }
    try {
      authService.verifyAccessToken(token)
      const { refreshToken } = req.body
      if (refreshToken) {
        authService.logout(refreshToken)
      }
      res.json({ success: true })
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
  })

  router.get('/me', (req, res) => {
    const token = req.headers.authorization?.slice(7)
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }
    try {
      const payload = authService.verifyAccessToken(token)
      const user = authService.findUserById(payload.sub)
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' })
        return
      }
      res.json({ success: true, data: toPublic(user) })
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
  })

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/writing/auth', router)

  return app
}

describe('Auth Routes', () => {
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

  describe('POST /api/writing/auth/register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'new@example.com', displayName: 'New User', password: 'password123', role: 'student' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe('new@example.com')
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).toBeDefined()
    })

    it('returns 409 for duplicate email', async () => {
      await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'dup@example.com', displayName: 'User 1', password: 'password123', role: 'student' })

      const res = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'dup@example.com', displayName: 'User 2', password: 'password456', role: 'student' })

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
    })

    it('returns 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'bad', displayName: '', password: '123', role: 'student' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/writing/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'login@example.com', displayName: 'User', password: 'password123', role: 'student' })

      const res = await request(app)
        .post('/api/writing/auth/login')
        .send({ email: 'login@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.accessToken).toBeDefined()
    })

    it('returns 401 for wrong password', async () => {
      await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'login@example.com', displayName: 'User', password: 'password123', role: 'student' })

      const res = await request(app)
        .post('/api/writing/auth/login')
        .send({ email: 'login@example.com', password: 'wrong' })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/writing/auth/refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'refresh@example.com', displayName: 'User', password: 'password123', role: 'student' })

      const res = await request(app)
        .post('/api/writing/auth/refresh')
        .send({ refreshToken: registerRes.body.data.refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).not.toBe(registerRes.body.data.refreshToken)
    })

    it('returns 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/writing/auth/refresh')
        .send({ refreshToken: 'bad-token' })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/writing/auth/logout', () => {
    it('logs out and invalidates refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'logout@example.com', displayName: 'User', password: 'password123', role: 'student' })

      const { accessToken, refreshToken } = registerRes.body.data

      const res = await request(app)
        .post('/api/writing/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const refreshRes = await request(app)
        .post('/api/writing/auth/refresh')
        .send({ refreshToken })

      expect(refreshRes.status).toBe(401)
    })

    it('returns 401 without auth header', async () => {
      const res = await request(app)
        .post('/api/writing/auth/logout')
        .send({})

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/writing/auth/me', () => {
    it('returns current user for valid token', async () => {
      const registerRes = await request(app)
        .post('/api/writing/auth/register')
        .send({ email: 'me@example.com', displayName: 'Me User', password: 'password123', role: 'student' })

      const res = await request(app)
        .get('/api/writing/auth/me')
        .set('Authorization', `Bearer ${registerRes.body.data.accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe('me@example.com')
      expect(res.body.data.displayName).toBe('Me User')
      // Should not expose passwordHash
      expect(res.body.data.passwordHash).toBeUndefined()
    })

    it('returns 401 without token', async () => {
      const res = await request(app)
        .get('/api/writing/auth/me')

      expect(res.status).toBe(401)
    })
  })
})
