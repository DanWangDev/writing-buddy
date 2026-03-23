import type { IWritingProgressRepository } from '../repositories/interfaces/progress-repository.js'
import { logger } from './logger.js'

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export class ProgressService {
  private readonly progressRepo: IWritingProgressRepository

  constructor(progressRepo: IWritingProgressRepository) {
    this.progressRepo = progressRepo
  }

  recordSubmissionActivity(userId: string): void {
    try {
      this.progressRepo.upsert({
        userId,
        date: getTodayUTC(),
        submissionsCount: 1,
      })
    } catch (error) {
      logger.error('Failed to record submission activity', {
        userId,
        error: String(error),
      })
    }
  }

  recordRevisionActivity(userId: string, wordsWritten: number): void {
    try {
      this.progressRepo.upsert({
        userId,
        date: getTodayUTC(),
        revisionsCount: 1,
        wordsWritten,
      })
    } catch (error) {
      logger.error('Failed to record revision activity', {
        userId,
        error: String(error),
      })
    }
  }

  recordCoachingActivity(userId: string): void {
    try {
      this.progressRepo.upsert({
        userId,
        date: getTodayUTC(),
        coachingSessions: 1,
      })
    } catch (error) {
      logger.error('Failed to record coaching activity', {
        userId,
        error: String(error),
      })
    }
  }

  awardXp(userId: string, xp: number): void {
    try {
      this.progressRepo.upsert({
        userId,
        date: getTodayUTC(),
        xpEarned: xp,
      })
    } catch (error) {
      logger.error('Failed to award XP', {
        userId,
        xp,
        error: String(error),
      })
    }
  }

  getStreakDays(userId: string): number {
    try {
      return this.progressRepo.getStreak(userId)
    } catch (error) {
      logger.error('Failed to get streak days', {
        userId,
        error: String(error),
      })
      return 0
    }
  }

  updateStreakInProgress(userId: string): void {
    try {
      const streak = this.progressRepo.getStreak(userId)
      this.progressRepo.upsert({
        userId,
        date: getTodayUTC(),
        streakDays: streak,
      })
    } catch (error) {
      logger.error('Failed to update streak in progress', {
        userId,
        error: String(error),
      })
    }
  }
}
