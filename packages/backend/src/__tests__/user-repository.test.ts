import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'

describe('SqliteUserRepository', () => {
  let db: DatabaseType
  let repo: SqliteUserRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    repo = new SqliteUserRepository(db)
  })

  describe('create', () => {
    it('creates a user and returns it', () => {
      const user = repo.create({
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
        role: 'student',
        passwordHash: 'hashed_password',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.displayName).toBe('Test User')
      expect(user.role).toBe('student')
      expect(user.passwordHash).toBe('hashed_password')
      expect(user.subscriptionPlan).toBe('free')
      expect(user.subscriptionStatus).toBe('trial')
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()
    })

    it('throws on duplicate email', () => {
      repo.create({
        email: 'dup@example.com',
        displayName: 'User 1',
        password: 'password123',
        role: 'student',
        passwordHash: 'hash1',
      })

      expect(() =>
        repo.create({
          email: 'dup@example.com',
          displayName: 'User 2',
          password: 'password123',
          role: 'student',
          passwordHash: 'hash2',
        })
      ).toThrow()
    })
  })

  describe('findById', () => {
    it('returns user by id', () => {
      const created = repo.create({
        email: 'find@example.com',
        displayName: 'Find Me',
        password: 'password123',
        role: 'tutor',
        passwordHash: 'hash',
      })

      const found = repo.findById(created.id)
      expect(found).not.toBeNull()
      expect(found!.email).toBe('find@example.com')
      expect(found!.role).toBe('tutor')
    })

    it('returns null for nonexistent id', () => {
      const found = repo.findById('nonexistent-id')
      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('returns user by email', () => {
      repo.create({
        email: 'email@example.com',
        displayName: 'Email User',
        password: 'password123',
        role: 'parent',
        passwordHash: 'hash',
      })

      const found = repo.findByEmail('email@example.com')
      expect(found).not.toBeNull()
      expect(found!.displayName).toBe('Email User')
    })

    it('returns null for nonexistent email', () => {
      const found = repo.findByEmail('nope@example.com')
      expect(found).toBeNull()
    })
  })

  describe('updateSubscription', () => {
    it('updates subscription plan and status', () => {
      const user = repo.create({
        email: 'sub@example.com',
        displayName: 'Sub User',
        password: 'password123',
        role: 'student',
        passwordHash: 'hash',
      })

      const updated = repo.updateSubscription(user.id, 'writing', 'active')
      expect(updated).not.toBeNull()
      expect(updated!.subscriptionPlan).toBe('writing')
      expect(updated!.subscriptionStatus).toBe('active')
    })

    it('returns null for nonexistent user', () => {
      const result = repo.updateSubscription('nonexistent', 'writing', 'active')
      expect(result).toBeNull()
    })
  })
})
