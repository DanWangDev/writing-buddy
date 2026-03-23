import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { AuthService } from '../services/auth-service.js'

describe('AuthService', () => {
  let db: DatabaseType
  let authService: AuthService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    authService = new AuthService(db)
  })

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      const result = await authService.register(
        'test@example.com',
        'Test User',
        'password123',
        'student',
      )

      expect(result.user.email).toBe('test@example.com')
      expect(result.user.displayName).toBe('Test User')
      expect(result.user.role).toBe('student')
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('throws on duplicate email', async () => {
      await authService.register('dup@example.com', 'User 1', 'password123', 'student')

      await expect(
        authService.register('dup@example.com', 'User 2', 'password456', 'student')
      ).rejects.toThrow('Email already registered')
    })

    it('throws on invalid email', async () => {
      await expect(
        authService.register('not-an-email', 'User', 'password123', 'student')
      ).rejects.toThrow()
    })

    it('throws on short password', async () => {
      await expect(
        authService.register('test@example.com', 'User', 'short', 'student')
      ).rejects.toThrow()
    })
  })

  describe('login', () => {
    it('returns user and tokens on valid credentials', async () => {
      await authService.register('login@example.com', 'Login User', 'password123', 'student')

      const result = await authService.login('login@example.com', 'password123')

      expect(result.user.email).toBe('login@example.com')
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('throws on wrong password', async () => {
      await authService.register('login@example.com', 'User', 'password123', 'student')

      await expect(
        authService.login('login@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password')
    })

    it('throws on nonexistent email', async () => {
      await expect(
        authService.login('nope@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password')
    })
  })

  describe('refreshToken', () => {
    it('returns new tokens and rotates refresh token', async () => {
      const { tokens: originalTokens } = await authService.register(
        'refresh@example.com', 'User', 'password123', 'student',
      )

      const result = authService.refreshToken(originalTokens.refreshToken)

      expect(result.user.email).toBe('refresh@example.com')
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).not.toBe(originalTokens.refreshToken)
    })

    it('throws on invalid refresh token', () => {
      expect(() => authService.refreshToken('invalid-token')).toThrow('Invalid refresh token')
    })

    it('throws on reuse of rotated refresh token', async () => {
      const { tokens } = await authService.register(
        'rotate@example.com', 'User', 'password123', 'student',
      )

      authService.refreshToken(tokens.refreshToken)

      expect(() => authService.refreshToken(tokens.refreshToken)).toThrow('Invalid refresh token')
    })
  })

  describe('logout', () => {
    it('deletes the refresh token', async () => {
      const { tokens } = await authService.register(
        'logout@example.com', 'User', 'password123', 'student',
      )

      authService.logout(tokens.refreshToken)

      expect(() => authService.refreshToken(tokens.refreshToken)).toThrow('Invalid refresh token')
    })
  })

  describe('verifyAccessToken', () => {
    it('returns payload for valid token', async () => {
      const { tokens } = await authService.register(
        'verify@example.com', 'User', 'password123', 'student',
      )

      const payload = authService.verifyAccessToken(tokens.accessToken)

      expect(payload.email).toBe('verify@example.com')
      expect(payload.role).toBe('student')
      expect(payload.plan).toBe('free')
      expect(payload.apps).toEqual(['writing'])
      expect(payload.features).toEqual([])
    })

    it('throws on invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid')).toThrow()
    })
  })
})
