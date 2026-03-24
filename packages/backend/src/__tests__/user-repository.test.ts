import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'

describe('SqliteUserRepository (hub auth)', () => {
  let db: DatabaseType
  let repo: SqliteUserRepository
  let appUserRepo: SqliteAppUserRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    repo = new SqliteUserRepository(db)
    appUserRepo = new SqliteAppUserRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('findById', () => {
    it('returns user info from app_users table', () => {
      appUserRepo.upsert('42', 'Hub User', 'hub@example.com', 'student')

      const found = repo.findById('42')
      expect(found).not.toBeNull()
      expect(found!.id).toBe('42')
      expect(found!.displayName).toBe('Hub User')
      expect(found!.email).toBe('hub@example.com')
      expect(found!.role).toBe('student')
    })

    it('returns null for nonexistent id', () => {
      const found = repo.findById('nonexistent-id')
      expect(found).toBeNull()
    })
  })
})
