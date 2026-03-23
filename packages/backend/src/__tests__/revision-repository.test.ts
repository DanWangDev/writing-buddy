import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'

describe('SqliteRevisionRepository', () => {
  let db: DatabaseType
  let repo: SqliteRevisionRepository
  let submissionId: string

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    repo = new SqliteRevisionRepository(db)

    const userRepo = new SqliteUserRepository(db)
    const user = userRepo.create({
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'password123',
      role: 'student',
      passwordHash: 'hashed',
    })

    const subRepo = new SqliteSubmissionRepository(db)
    const submission = subRepo.create(user.id)
    submissionId = submission.id
  })

  describe('create', () => {
    it('creates a revision with auto-incremented number', () => {
      const r1 = repo.create(submissionId, 'This is my first draft of the story about dragons.')
      expect(r1.revisionNumber).toBe(1)
      expect(r1.submissionId).toBe(submissionId)
      expect(r1.content).toBe('This is my first draft of the story about dragons.')
      expect(r1.wordCount).toBe(10)
      expect(r1.createdAt).toBeDefined()

      const r2 = repo.create(submissionId, 'Second draft is much better than the first one.')
      expect(r2.revisionNumber).toBe(2)
    })

    it('updates submission current_revision and word_count', () => {
      repo.create(submissionId, 'A story about a brave knight and a magical sword.')

      const subRepo = new SqliteSubmissionRepository(db)
      const submission = subRepo.findById(submissionId)

      expect(submission).not.toBeNull()
      expect(submission!.currentRevision).toBe(1)
      expect(submission!.wordCount).toBe(10)
    })
  })

  describe('findBySubmissionId', () => {
    it('returns all revisions in order', () => {
      repo.create(submissionId, 'First draft content here.')
      repo.create(submissionId, 'Second draft content here.')
      repo.create(submissionId, 'Third draft content here.')

      const revisions = repo.findBySubmissionId(submissionId)
      expect(revisions).toHaveLength(3)
      expect(revisions[0].revisionNumber).toBe(1)
      expect(revisions[1].revisionNumber).toBe(2)
      expect(revisions[2].revisionNumber).toBe(3)
    })

    it('returns empty array for submission with no revisions', () => {
      const revisions = repo.findBySubmissionId(submissionId)
      expect(revisions).toEqual([])
    })
  })

  describe('findLatest', () => {
    it('returns the most recent revision', () => {
      repo.create(submissionId, 'First draft.')
      repo.create(submissionId, 'Latest revision content.')

      const latest = repo.findLatest(submissionId)
      expect(latest).not.toBeNull()
      expect(latest!.revisionNumber).toBe(2)
      expect(latest!.content).toBe('Latest revision content.')
    })

    it('returns null when no revisions exist', () => {
      const latest = repo.findLatest(submissionId)
      expect(latest).toBeNull()
    })
  })

  describe('countBySubmissionId', () => {
    it('counts revisions for a submission', () => {
      expect(repo.countBySubmissionId(submissionId)).toBe(0)

      repo.create(submissionId, 'Draft one.')
      expect(repo.countBySubmissionId(submissionId)).toBe(1)

      repo.create(submissionId, 'Draft two.')
      expect(repo.countBySubmissionId(submissionId)).toBe(2)
    })
  })

  describe('word count calculation', () => {
    it('counts words correctly with extra whitespace', () => {
      const revision = repo.create(submissionId, '  Hello   world   test  ')
      expect(revision.wordCount).toBe(3)
    })
  })
})
