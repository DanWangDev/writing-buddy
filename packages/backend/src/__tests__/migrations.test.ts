import { describe, it, expect, beforeEach } from 'vitest'
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

  it('runs all migrations without error on a fresh database', () => {
    const migrator = new Migrator(db, migrations)
    expect(() => migrator.migrate()).not.toThrow()
  })

  it('creates all expected tables', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    const tables = (db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\\_%' ESCAPE '\\'"
    ).all() as { name: string }[]).map(r => r.name)

    expect(tables).toContain('users')
    expect(tables).toContain('prompts')
    expect(tables).toContain('submissions')
    expect(tables).toContain('revisions')
    expect(tables).toContain('coaching_passes')
    expect(tables).toContain('writing_progress')
    expect(tables).toContain('challenges')
    expect(tables).toContain('rubric_scores')
    expect(tables).toContain('refresh_tokens')
  })

  it('is idempotent - running migrations twice does not error', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    expect(() => migrator.migrate()).not.toThrow()
  })

  it('enforces foreign key constraints on submissions.user_id', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    expect(() => {
      db.prepare(`
        INSERT INTO submissions (id, user_id, status, word_count)
        VALUES ('s1', 'nonexistent', 'draft', 0)
      `).run()
    }).toThrow()
  })

  it('enforces unique email constraint on users', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    db.prepare(`
      INSERT INTO users (id, email, display_name, password_hash, role)
      VALUES ('u1', 'test@example.com', 'Test', 'hash', 'student')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO users (id, email, display_name, password_hash, role)
        VALUES ('u2', 'test@example.com', 'Test2', 'hash2', 'student')
      `).run()
    }).toThrow()
  })

  it('enforces unique user_id+date on writing_progress', () => {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    db.prepare(`
      INSERT INTO users (id, email, display_name, password_hash, role)
      VALUES ('u1', 'test@example.com', 'Test', 'hash', 'student')
    `).run()

    db.prepare(`
      INSERT INTO writing_progress (id, user_id, date)
      VALUES ('wp1', 'u1', '2026-01-01')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO writing_progress (id, user_id, date)
        VALUES ('wp2', 'u1', '2026-01-01')
      `).run()
    }).toThrow()
  })
})
