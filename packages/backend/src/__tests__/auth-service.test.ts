import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { mockHubClaims } from '@labf/auth-client/test-helpers'

describe('User Sync Service', () => {
  let db: DatabaseType
  let appUserRepo: SqliteAppUserRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    appUserRepo = new SqliteAppUserRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('creates app_users record from hub claims', () => {
    const syncUser = createUserSync(appUserRepo)
    const claims = mockHubClaims({
      sub: '42',
      email: 'sync@example.com',
      displayName: 'Sync User',
      role: 'student',
    })

    syncUser(claims)

    const user = appUserRepo.findByHubUserId('42')
    expect(user).not.toBeNull()
    expect(user!.displayName).toBe('Sync User')
    expect(user!.email).toBe('sync@example.com')
    expect(user!.role).toBe('student')
  })

  it('updates existing record on re-sync', () => {
    const syncUser = createUserSync(appUserRepo)

    syncUser(mockHubClaims({ sub: '42', displayName: 'Original' }))
    syncUser(mockHubClaims({ sub: '42', displayName: 'Updated' }))

    const user = appUserRepo.findByHubUserId('42')
    expect(user!.displayName).toBe('Updated')
  })
})

describe('AppUser Repository', () => {
  let db: DatabaseType
  let repo: SqliteAppUserRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    repo = new SqliteAppUserRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('returns null for nonexistent user', () => {
    expect(repo.findByHubUserId('999')).toBeNull()
  })

  it('upserts and retrieves user', () => {
    const user = repo.upsert('1', 'Alice', 'alice@example.com', 'student')
    expect(user.hubUserId).toBe('1')
    expect(user.displayName).toBe('Alice')
    expect(user.preferences).toEqual({})
  })

  it('updates preferences', () => {
    repo.upsert('1', 'Alice', 'alice@example.com', 'student')
    const updated = repo.updatePreferences('1', { theme: 'dark' })
    expect(updated!.preferences).toEqual({ theme: 'dark' })
  })

  it('returns null when updating preferences for nonexistent user', () => {
    const result = repo.updatePreferences('999', { theme: 'dark' })
    expect(result).toBeNull()
  })
})
