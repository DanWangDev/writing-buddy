import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'

describe('SqliteProgressRepository', () => {
  let db: DatabaseType
  let progressRepo: SqliteProgressRepository
  const userId = 'hub-user-1'

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    progressRepo = new SqliteProgressRepository(db)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('upsert', () => {
    it('creates a new progress record', () => {
      const result = progressRepo.upsert({
        userId,
        date: '2026-03-23',
        submissionsCount: 1,
      })

      expect(result.userId).toBe(userId)
      expect(result.date).toBe('2026-03-23')
      expect(result.submissionsCount).toBe(1)
      expect(result.revisionsCount).toBe(0)
    })

    it('increments existing counters on upsert', () => {
      progressRepo.upsert({
        userId,
        date: '2026-03-23',
        submissionsCount: 1,
        wordsWritten: 100,
      })

      const updated = progressRepo.upsert({
        userId,
        date: '2026-03-23',
        submissionsCount: 1,
        wordsWritten: 50,
      })

      expect(updated.submissionsCount).toBe(2)
      expect(updated.wordsWritten).toBe(150)
    })

    it('updates streak days when provided', () => {
      progressRepo.upsert({
        userId,
        date: '2026-03-23',
        submissionsCount: 1,
      })

      const updated = progressRepo.upsert({
        userId,
        date: '2026-03-23',
        streakDays: 5,
      })

      expect(updated.streakDays).toBe(5)
    })
  })

  describe('findByUserAndDate', () => {
    it('returns null when no progress exists', () => {
      const result = progressRepo.findByUserAndDate(userId, '2026-03-23')
      expect(result).toBeNull()
    })

    it('returns existing progress record', () => {
      progressRepo.upsert({
        userId,
        date: '2026-03-23',
        submissionsCount: 2,
      })

      const result = progressRepo.findByUserAndDate(userId, '2026-03-23')
      expect(result).not.toBeNull()
      expect(result!.submissionsCount).toBe(2)
    })
  })

  describe('getStreak', () => {
    it('returns 0 for user with no progress', () => {
      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(0)
    })

    it('returns 1 for single day of activity today', () => {
      const today = new Date().toISOString().slice(0, 10)
      progressRepo.upsert({
        userId,
        date: today,
        submissionsCount: 1,
      })

      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(1)
    })

    it('counts consecutive days backwards from today', () => {
      const today = new Date()
      for (let i = 0; i < 5; i++) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - i)
        const dateStr = date.toISOString().slice(0, 10)
        progressRepo.upsert({
          userId,
          date: dateStr,
          submissionsCount: 1,
        })
      }

      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(5)
    })

    it('resets streak on gap', () => {
      const today = new Date()

      // Today
      progressRepo.upsert({
        userId,
        date: today.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      // Yesterday
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      progressRepo.upsert({
        userId,
        date: yesterday.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      // Skip a day, then 3 days ago
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3)
      progressRepo.upsert({
        userId,
        date: threeDaysAgo.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(2)
    })

    it('includes yesterday as valid streak start', () => {
      const yesterday = new Date()
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)

      progressRepo.upsert({
        userId,
        date: yesterday.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(1)
    })

    it('returns 0 when most recent activity is older than yesterday', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3)

      progressRepo.upsert({
        userId,
        date: threeDaysAgo.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      const streak = progressRepo.getStreak(userId)
      expect(streak).toBe(0)
    })
  })

  describe('getRecentProgress', () => {
    it('returns empty array when no progress exists', () => {
      const result = progressRepo.getRecentProgress(userId, 30)
      expect(result).toEqual([])
    })

    it('returns progress within the date range', () => {
      const today = new Date()
      for (let i = 0; i < 3; i++) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - i)
        progressRepo.upsert({
          userId,
          date: date.toISOString().slice(0, 10),
          submissionsCount: i + 1,
        })
      }

      const result = progressRepo.getRecentProgress(userId, 7)
      expect(result).toHaveLength(3)
      expect(result[0].date).toBe(today.toISOString().slice(0, 10))
    })

    it('excludes progress outside the date range', () => {
      const oldDate = new Date()
      oldDate.setUTCDate(oldDate.getUTCDate() - 40)

      progressRepo.upsert({
        userId,
        date: oldDate.toISOString().slice(0, 10),
        submissionsCount: 1,
      })

      const result = progressRepo.getRecentProgress(userId, 30)
      expect(result).toEqual([])
    })
  })
})
