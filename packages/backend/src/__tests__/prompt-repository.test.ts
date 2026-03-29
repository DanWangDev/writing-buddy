import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'

describe('SqlitePromptRepository', () => {
  let db: DatabaseType
  let repo: SqlitePromptRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    repo = new SqlitePromptRepository(db)
  })

  describe('create', () => {
    it('creates a prompt and returns it', () => {
      const prompt = repo.create({
        title: 'Test Prompt',
        body: 'Write about a dragon.',
        genre: 'fantasy',
        difficulty: 'beginner',
        wordCountTarget: 200,
        tags: ['dragons', 'magic'],
      })

      expect(prompt.id).toBeDefined()
      expect(prompt.title).toBe('Test Prompt')
      expect(prompt.body).toBe('Write about a dragon.')
      expect(prompt.genre).toBe('fantasy')
      expect(prompt.difficulty).toBe('beginner')
      expect(prompt.wordCountTarget).toBe(200)
      expect(prompt.tags).toEqual(['dragons', 'magic'])
      expect(prompt.createdAt).toBeDefined()
    })

    it('handles prompts with no optional fields', () => {
      const prompt = repo.create({
        title: 'Minimal Prompt',
        body: 'Write something.',
        genre: 'humor',
        difficulty: 'standard',
        tags: [],
      })

      expect(prompt.wordCountTarget).toBeUndefined()
      expect(prompt.timeLimitMinutes).toBeUndefined()
      expect(prompt.tags).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns prompt by id', () => {
      const created = repo.create({
        title: 'Find Me',
        body: 'Find this prompt.',
        genre: 'mystery',
        difficulty: 'challenge',
        tags: ['clue'],
      })

      const found = repo.findById(created.id)
      expect(found).not.toBeNull()
      expect(found!.title).toBe('Find Me')
    })

    it('returns null for nonexistent id', () => {
      const found = repo.findById('nonexistent-id')
      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns all prompts without filters', () => {
      repo.create({ title: 'P1', body: 'B1', genre: 'fantasy', difficulty: 'beginner', tags: [] })
      repo.create({ title: 'P2', body: 'B2', genre: 'mystery', difficulty: 'standard', tags: [] })

      const prompts = repo.findAll()
      expect(prompts).toHaveLength(2)
    })

    it('filters by genre', () => {
      repo.create({ title: 'Fantasy', body: 'B', genre: 'fantasy', difficulty: 'beginner', tags: [] })
      repo.create({ title: 'Mystery', body: 'B', genre: 'mystery', difficulty: 'beginner', tags: [] })

      const result = repo.findAll({ genre: 'fantasy' })
      expect(result).toHaveLength(1)
      expect(result[0].genre).toBe('fantasy')
    })

    it('filters by difficulty', () => {
      repo.create({ title: 'Easy', body: 'B', genre: 'humor', difficulty: 'beginner', tags: [] })
      repo.create({ title: 'Hard', body: 'B', genre: 'humor', difficulty: 'challenge', tags: [] })

      const result = repo.findAll({ difficulty: 'challenge' })
      expect(result).toHaveLength(1)
      expect(result[0].difficulty).toBe('challenge')
    })
  })

  describe('count', () => {
    it('counts all prompts', () => {
      repo.create({ title: 'P1', body: 'B1', genre: 'fantasy', difficulty: 'beginner', tags: [] })
      repo.create({ title: 'P2', body: 'B2', genre: 'mystery', difficulty: 'standard', tags: [] })

      expect(repo.count()).toBe(2)
    })

    it('counts with filters', () => {
      repo.create({ title: 'P1', body: 'B1', genre: 'fantasy', difficulty: 'beginner', tags: [] })
      repo.create({ title: 'P2', body: 'B2', genre: 'mystery', difficulty: 'standard', tags: [] })

      expect(repo.count({ genre: 'fantasy' })).toBe(1)
    })
  })

  describe('update', () => {
    it('updates prompt fields', () => {
      const created = repo.create({ title: 'Original', body: 'Original body text here.', genre: 'fantasy', difficulty: 'beginner', tags: ['old'] })

      const updated = repo.update(created.id, { title: 'Updated Title' })
      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('Updated Title')
      expect(updated!.body).toBe('Original body text here.')
      expect(updated!.updatedAt).toBeDefined()
    })

    it('updates multiple fields at once', () => {
      const created = repo.create({ title: 'Test', body: 'Test body for updating.', genre: 'fantasy', difficulty: 'beginner', tags: ['a'] })

      const updated = repo.update(created.id, { title: 'New', genre: 'mystery', tags: ['b', 'c'] })
      expect(updated!.title).toBe('New')
      expect(updated!.genre).toBe('mystery')
      expect(updated!.tags).toEqual(['b', 'c'])
    })

    it('returns null for nonexistent prompt', () => {
      const result = repo.update('nonexistent', { title: 'Nope' })
      expect(result).toBeNull()
    })

    it('returns null for archived prompt', () => {
      const created = repo.create({ title: 'Will Archive', body: 'Archive me soon.', genre: 'humor', difficulty: 'standard', tags: ['x'] })
      repo.delete(created.id)

      const result = repo.update(created.id, { title: 'Should Fail' })
      expect(result).toBeNull()
    })

    it('filters out unknown fields (column whitelist)', () => {
      const created = repo.create({ title: 'Safe', body: 'Safety test body here.', genre: 'fantasy', difficulty: 'beginner', tags: [] })

      // Pass unknown fields — they should be silently ignored
      const updated = repo.update(created.id, { title: 'Updated', unknownField: 'evil' } as never)
      expect(updated!.title).toBe('Updated')
    })
  })

  describe('delete (soft-delete)', () => {
    it('soft-deletes a prompt', () => {
      const created = repo.create({ title: 'Delete Me', body: 'To be deleted.', genre: 'fantasy', difficulty: 'beginner', tags: [] })

      const result = repo.delete(created.id)
      expect(result).toBe(true)

      // Should not appear in findAll
      const all = repo.findAll()
      expect(all.find(p => p.id === created.id)).toBeUndefined()
    })

    it('findById still returns archived prompts', () => {
      const created = repo.create({ title: 'Archived', body: 'Still findable.', genre: 'mystery', difficulty: 'standard', tags: [] })
      repo.delete(created.id)

      const found = repo.findById(created.id)
      expect(found).not.toBeNull()
      expect(found!.archivedAt).toBeDefined()
    })

    it('is idempotent on already-archived prompts', () => {
      const created = repo.create({ title: 'Double Delete', body: 'Delete me twice.', genre: 'humor', difficulty: 'beginner', tags: [] })
      repo.delete(created.id)

      // Second delete should still succeed (idempotent)
      const result = repo.delete(created.id)
      expect(result).toBe(true)
    })

    it('returns false for nonexistent prompt', () => {
      const result = repo.delete('nonexistent-id')
      expect(result).toBe(false)
    })

    it('excludes archived from count()', () => {
      repo.create({ title: 'P1', body: 'B1', genre: 'fantasy', difficulty: 'beginner', tags: [] })
      const p2 = repo.create({ title: 'P2', body: 'B2', genre: 'mystery', difficulty: 'standard', tags: [] })

      expect(repo.count()).toBe(2)
      repo.delete(p2.id)
      expect(repo.count()).toBe(1)
    })
  })
})
