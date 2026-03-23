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
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { createProgressRouter } from '../routes/progress.js'

async function registerAndGetToken(
  authService: AuthService,
  email: string = 'progress-route@example.com'
): Promise<string> {
  const { tokens } = await authService.register(email, 'ProgressUser', 'password123', 'student')
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

  const progressRouter = createProgressRouter(db)
  app.use('/api/writing/progress', progressRouter)

  return { app, authService }
}

describe('Progress Routes', () => {
  let db: DatabaseType
  let app: express.Express
  let authService: AuthService
  let token: string
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
  })

  describe('GET /api/writing/progress', () => {
    it('returns empty progress for new user', async () => {
      const res = await request(app)
        .get('/api/writing/progress')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
    })

    it('returns recent progress data', async () => {
      const progressRepo = new SqliteProgressRepository(db)
      const today = new Date().toISOString().slice(0, 10)
      progressRepo.upsert({
        userId,
        date: today,
        submissionsCount: 2,
        wordsWritten: 300,
      })

      const res = await request(app)
        .get('/api/writing/progress')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].submissionsCount).toBe(2)
      expect(res.body.data[0].wordsWritten).toBe(300)
    })

    it('accepts days query parameter', async () => {
      const res = await request(app)
        .get('/api/writing/progress?days=7')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .get('/api/writing/progress')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/writing/progress/streak', () => {
    it('returns 0 streak for new user', async () => {
      const res = await request(app)
        .get('/api/writing/progress/streak')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.streakDays).toBe(0)
    })

    it('returns correct streak count', async () => {
      const progressRepo = new SqliteProgressRepository(db)
      const today = new Date()

      for (let i = 0; i < 3; i++) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - i)
        progressRepo.upsert({
          userId,
          date: date.toISOString().slice(0, 10),
          submissionsCount: 1,
        })
      }

      const res = await request(app)
        .get('/api/writing/progress/streak')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.streakDays).toBe(3)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .get('/api/writing/progress/streak')

      expect(res.status).toBe(401)
    })
  })
})
