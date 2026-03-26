import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import type { HubUser } from '@danwangdev/auth-client/types'

function mockHubUser(overrides: Partial<HubUser> = {}): HubUser {
  return {
    sub: '1',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    email_verified: true,
    role: 'student',
    plan: 'free',
    features: [],
    apps: ['writing-buddy'],
    expires_at: null,
    ...overrides,
  }
}

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
    const hubUser = mockHubUser({
      sub: '42',
      email: 'sync@example.com',
      display_name: 'Sync User',
      role: 'student',
    })

    syncUser(hubUser)

    const user = appUserRepo.findByHubUserId('42')
    expect(user).not.toBeNull()
    expect(user!.displayName).toBe('Sync User')
    expect(user!.email).toBe('sync@example.com')
    expect(user!.role).toBe('student')
  })

  it('updates existing record on re-sync', () => {
    const syncUser = createUserSync(appUserRepo)

    syncUser(mockHubUser({ sub: '42', display_name: 'Original' }))
    syncUser(mockHubUser({ sub: '42', display_name: 'Updated' }))

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
