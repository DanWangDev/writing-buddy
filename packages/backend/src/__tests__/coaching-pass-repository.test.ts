import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteCoachingPassRepository } from '../repositories/sqlite/coaching-pass-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'

describe('SqliteCoachingPassRepository', () => {
  let db: DatabaseType
  let repo: SqliteCoachingPassRepository
  let submissionId: string
  let userId: string

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    repo = new SqliteCoachingPassRepository(db)

    const userRepo = new SqliteUserRepository(db)
    const user = userRepo.create({
      email: 'coach-test@example.com',
      displayName: 'Coach Tester',
      password: 'password123',
      role: 'student',
      passwordHash: 'hashed',
    })
    userId = user.id

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(userId)
    submissionId = submission.id

    db.prepare(`
      INSERT INTO revisions (id, submission_id, revision_number, content, word_count, created_at)
      VALUES (?, ?, 1, 'Test content', 2, datetime('now'))
    `).run('rev-1', submissionId)
  })

  describe('create', () => {
    it('creates a coaching pass', () => {
      const pass = repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'acknowledgment',
        feedback: 'Great start!',
        llmModel: 'claude-haiku-4-5-20251001',
        llmTokensUsed: 150,
      })

      expect(pass.id).toBeDefined()
      expect(pass.submissionId).toBe(submissionId)
      expect(pass.passType).toBe('acknowledgment')
      expect(pass.feedback).toBe('Great start!')
      expect(pass.llmModel).toBe('claude-haiku-4-5-20251001')
      expect(pass.llmTokensUsed).toBe(150)
      expect(pass.createdAt).toBeDefined()
    })

    it('creates a pass without optional fields', () => {
      const pass = repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'guiding_questions',
        feedback: 'What if you added more detail?',
      })

      expect(pass.focusDimension).toBeUndefined()
      expect(pass.llmModel).toBeUndefined()
      expect(pass.llmTokensUsed).toBeUndefined()
    })
  })

  describe('findBySubmissionId', () => {
    it('returns all passes for a submission in order', () => {
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'acknowledgment',
        feedback: 'First pass',
      })
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'guiding_questions',
        feedback: 'Second pass',
      })

      const passes = repo.findBySubmissionId(submissionId)

      expect(passes).toHaveLength(2)
      expect(passes[0].passType).toBe('acknowledgment')
      expect(passes[1].passType).toBe('guiding_questions')
    })

    it('returns empty array when no passes exist', () => {
      const passes = repo.findBySubmissionId('nonexistent')
      expect(passes).toEqual([])
    })
  })

  describe('countTodayByUserId', () => {
    it('counts passes created today for a user', () => {
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'acknowledgment',
        feedback: 'Pass 1',
      })
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'guiding_questions',
        feedback: 'Pass 2',
      })

      const count = repo.countTodayByUserId(userId)
      expect(count).toBe(2)
    })

    it('returns 0 for user with no passes', () => {
      const count = repo.countTodayByUserId('no-such-user')
      expect(count).toBe(0)
    })
  })

  describe('sumTodayTokens', () => {
    it('sums tokens from all passes today', () => {
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'acknowledgment',
        feedback: 'Pass 1',
        llmTokensUsed: 100,
      })
      repo.create({
        submissionId,
        revisionNumber: 1,
        passType: 'guiding_questions',
        feedback: 'Pass 2',
        llmTokensUsed: 250,
      })

      const total = repo.sumTodayTokens()
      expect(total).toBe(350)
    })

    it('returns 0 when no passes exist', () => {
      const total = repo.sumTodayTokens()
      expect(total).toBe(0)
    })
  })
})
