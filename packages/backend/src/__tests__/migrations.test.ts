import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'

describe('Database Migrations', () => {
  let db: DatabaseType

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
  })

  afterEach(() => {
    db.close()
  })

  it('runs all migrations without error on a fresh database', () => {
    const migrator = new Migrator(db, migrations)
    expect(() => migrator.migrate()).not.toThrow()
  })

  it('creates all expected tables after hub auth migration', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    const tables = (db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\\_%' ESCAPE '\\'"
    ).all() as { name: string }[]).map(r => r.name)

    expect(tables).toContain('app_users')
    expect(tables).toContain('prompts')
    expect(tables).toContain('submissions')
    expect(tables).toContain('revisions')
    expect(tables).toContain('coaching_passes')
    expect(tables).toContain('writing_progress')
    expect(tables).toContain('challenges')
    expect(tables).toContain('rubric_scores')

    // Old auth tables should be gone
    expect(tables).not.toContain('users')
    expect(tables).not.toContain('refresh_tokens')
  })

  it('is idempotent - running migrations twice does not error', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    expect(() => migrator.migrate()).not.toThrow()
  })

  it('submissions.user_id accepts any TEXT (no foreign key to users)', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    // user_id is now a hub_user_id (TEXT), not a foreign key
    expect(() => {
      db.prepare(`
        INSERT INTO submissions (id, user_id, status, word_count)
        VALUES ('s1', 'hub-user-42', 'draft', 0)
      `).run()
    }).not.toThrow()
  })

  it('enforces unique hub_user_id on app_users', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    db.prepare(`
      INSERT INTO app_users (hub_user_id, display_name, email, role)
      VALUES ('42', 'Test', 'test@example.com', 'student')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO app_users (hub_user_id, display_name, email, role)
        VALUES ('42', 'Test2', 'test2@example.com', 'student')
      `).run()
    }).toThrow()
  })

  it('enforces unique user_id+date on writing_progress', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    db.prepare(`
      INSERT INTO writing_progress (id, user_id, date)
      VALUES ('wp1', 'hub-user-1', '2026-01-01')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO writing_progress (id, user_id, date)
        VALUES ('wp2', 'hub-user-1', '2026-01-01')
      `).run()
    }).toThrow()
  })
})
