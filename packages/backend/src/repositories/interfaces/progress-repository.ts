import type { WritingProgress } from '@writting-buddy/shared'

export interface UpsertProgressDto {
  readonly userId: string
  readonly date: string
  readonly submissionsCount?: number
  readonly revisionsCount?: number
  readonly wordsWritten?: number
  readonly coachingSessions?: number
  readonly xpEarned?: number
  readonly streakDays?: number
}

export interface IWritingProgressRepository {
  findByUserAndDate(userId: string, date: string): WritingProgress | null
  upsert(data: UpsertProgressDto): WritingProgress
  getStreak(userId: string): number
  getRecentProgress(userId: string, days: number): WritingProgress[]
}
