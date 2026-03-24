import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { ProgressService } from '../services/progress-service.js'

describe('ProgressService', () => {
  let db: DatabaseType
  let progressRepo: SqliteProgressRepository
  let progressService: ProgressService
  const userId = 'hub-user-1'

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    progressRepo = new SqliteProgressRepository(db)
    progressService = new ProgressService(progressRepo)
  })

  it('records submission activity for today', () => {
    progressService.recordSubmissionActivity(userId)

    const today = new Date().toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, today)

    expect(progress).not.toBeNull()
    expect(progress!.submissionsCount).toBe(1)
  })

  it('records revision activity with word count', () => {
    progressService.recordRevisionActivity(userId, 150)

    const today = new Date().toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, today)

    expect(progress).not.toBeNull()
    expect(progress!.revisionsCount).toBe(1)
    expect(progress!.wordsWritten).toBe(150)
  })

  it('records coaching activity', () => {
    progressService.recordCoachingActivity(userId)

    const today = new Date().toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, today)

    expect(progress).not.toBeNull()
    expect(progress!.coachingSessions).toBe(1)
  })

  it('awards XP', () => {
    progressService.awardXp(userId, 25)

    const today = new Date().toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, today)

    expect(progress).not.toBeNull()
    expect(progress!.xpEarned).toBe(25)
  })

  it('accumulates multiple activities in a day', () => {
    progressService.recordSubmissionActivity(userId)
    progressService.recordRevisionActivity(userId, 100)
    progressService.recordRevisionActivity(userId, 50)
    progressService.recordCoachingActivity(userId)
    progressService.awardXp(userId, 15)

    const today = new Date().toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, today)

    expect(progress).not.toBeNull()
    expect(progress!.submissionsCount).toBe(1)
    expect(progress!.revisionsCount).toBe(2)
    expect(progress!.wordsWritten).toBe(150)
    expect(progress!.coachingSessions).toBe(1)
    expect(progress!.xpEarned).toBe(15)
  })

  it('returns streak days from repo', () => {
    const today = new Date()
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() - i)
      progressRepo.upsert({
        userId,
        date: date.toISOString().slice(0, 10),
        submissionsCount: 1,
      })
    }

    const streak = progressService.getStreakDays(userId)
    expect(streak).toBe(3)
  })

  it('updates streak in today progress record', () => {
    const today = new Date()
    for (let i = 0; i < 4; i++) {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() - i)
      progressRepo.upsert({
        userId,
        date: date.toISOString().slice(0, 10),
        submissionsCount: 1,
      })
    }

    progressService.updateStreakInProgress(userId)

    const todayStr = today.toISOString().slice(0, 10)
    const progress = progressRepo.findByUserAndDate(userId, todayStr)
    expect(progress!.streakDays).toBe(4)
  })
})
