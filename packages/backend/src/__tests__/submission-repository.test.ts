import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'

describe('SqliteSubmissionRepository', () => {
  let db: DatabaseType
  let repo: SqliteSubmissionRepository
  const userId = 'hub-user-1'
  let promptId: string

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    repo = new SqliteSubmissionRepository(db)

    const promptRepo = new SqlitePromptRepository(db)
    const prompt = promptRepo.create({
      title: 'Test Prompt',
      body: 'Write something.',
      genre: 'fantasy',
      difficulty: 'beginner',
      tags: [],
    })
    promptId = prompt.id
  })

  describe('create', () => {
    it('creates a submission with a prompt', () => {
      const submission = repo.create(userId, promptId)

      expect(submission.id).toBeDefined()
      expect(submission.userId).toBe(userId)
      expect(submission.promptId).toBe(promptId)
      expect(submission.status).toBe('draft')
      expect(submission.currentRevision).toBe(1)
      expect(submission.wordCount).toBe(0)
      expect(submission.xpEarned).toBe(0)
      expect(submission.startedAt).toBeDefined()
    })

    it('creates a submission without a prompt', () => {
      const submission = repo.create(userId)

      expect(submission.id).toBeDefined()
      expect(submission.promptId).toBeUndefined()
    })
  })

  describe('findById', () => {
    it('returns submission by id', () => {
      const created = repo.create(userId, promptId)
      const found = repo.findById(created.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
    })

    it('returns null for nonexistent id', () => {
      const found = repo.findById('nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('returns submissions for a user', () => {
      repo.create(userId, promptId)
      repo.create(userId)

      const submissions = repo.findByUserId(userId)
      expect(submissions).toHaveLength(2)
    })

    it('filters by status', () => {
      const s1 = repo.create(userId, promptId)
      repo.create(userId)

      repo.updateStatus(s1.id, 'in_coaching')

      const drafts = repo.findByUserId(userId, { status: 'draft' })
      expect(drafts).toHaveLength(1)

      const coaching = repo.findByUserId(userId, { status: 'in_coaching' })
      expect(coaching).toHaveLength(1)
    })
  })

  describe('updateStatus', () => {
    it('updates the status', () => {
      const submission = repo.create(userId, promptId)
      const updated = repo.updateStatus(submission.id, 'in_coaching')

      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('in_coaching')
    })

    it('returns null for nonexistent id', () => {
      const result = repo.updateStatus('nonexistent', 'draft')
      expect(result).toBeNull()
    })
  })

  describe('updateWordCount', () => {
    it('updates the word count', () => {
      const submission = repo.create(userId)
      const updated = repo.updateWordCount(submission.id, 150)

      expect(updated).not.toBeNull()
      expect(updated!.wordCount).toBe(150)
    })
  })

  describe('complete', () => {
    it('marks submission as completed with XP', () => {
      const submission = repo.create(userId, promptId)
      const completed = repo.complete(submission.id, 25)

      expect(completed).not.toBeNull()
      expect(completed!.status).toBe('completed')
      expect(completed!.xpEarned).toBe(25)
      expect(completed!.completedAt).toBeDefined()
    })

    it('returns null for nonexistent id', () => {
      const result = repo.complete('nonexistent', 10)
      expect(result).toBeNull()
    })
  })
})
