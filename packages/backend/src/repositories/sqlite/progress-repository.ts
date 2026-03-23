import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { WritingProgress } from '@writting-buddy/shared'
import type {
  IWritingProgressRepository,
  UpsertProgressDto,
} from '../interfaces/progress-repository.js'

interface ProgressRow {
  id: string
  user_id: string
  date: string
  submissions_count: number
  revisions_count: number
  words_written: number
  coaching_sessions: number
  xp_earned: number
  streak_days: number
}

function rowToProgress(row: ProgressRow): WritingProgress {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    submissionsCount: row.submissions_count,
    revisionsCount: row.revisions_count,
    wordsWritten: row.words_written,
    coachingSessions: row.coaching_sessions,
    xpEarned: row.xp_earned,
    streakDays: row.streak_days,
  }
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export class SqliteProgressRepository implements IWritingProgressRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findByUserAndDate(userId: string, date: string): WritingProgress | null {
    const row = this.db
      .prepare('SELECT * FROM writing_progress WHERE user_id = ? AND date = ?')
      .get(userId, date) as ProgressRow | undefined

    return row ? rowToProgress(row) : null
  }

  upsert(data: UpsertProgressDto): WritingProgress {
    const existing = this.findByUserAndDate(data.userId, data.date)

    if (existing) {
      this.db
        .prepare(
          `UPDATE writing_progress
           SET submissions_count = submissions_count + ?,
               revisions_count = revisions_count + ?,
               words_written = words_written + ?,
               coaching_sessions = coaching_sessions + ?,
               xp_earned = xp_earned + ?,
               streak_days = CASE WHEN ? > 0 THEN ? ELSE streak_days END
           WHERE user_id = ? AND date = ?`
        )
        .run(
          data.submissionsCount ?? 0,
          data.revisionsCount ?? 0,
          data.wordsWritten ?? 0,
          data.coachingSessions ?? 0,
          data.xpEarned ?? 0,
          data.streakDays ?? 0,
          data.streakDays ?? 0,
          data.userId,
          data.date
        )

      const updated = this.findByUserAndDate(data.userId, data.date)
      if (!updated) {
        throw new Error('Failed to update writing progress')
      }
      return updated
    }

    const id = crypto.randomUUID()

    this.db
      .prepare(
        `INSERT INTO writing_progress
          (id, user_id, date, submissions_count, revisions_count, words_written, coaching_sessions, xp_earned, streak_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.userId,
        data.date,
        data.submissionsCount ?? 0,
        data.revisionsCount ?? 0,
        data.wordsWritten ?? 0,
        data.coachingSessions ?? 0,
        data.xpEarned ?? 0,
        data.streakDays ?? 0
      )

    const created = this.findByUserAndDate(data.userId, data.date)
    if (!created) {
      throw new Error('Failed to create writing progress')
    }
    return created
  }

  getStreak(userId: string): number {
    const rows = this.db
      .prepare(
        `SELECT date FROM writing_progress
         WHERE user_id = ?
         ORDER BY date DESC`
      )
      .all(userId) as Array<{ date: string }>

    if (rows.length === 0) {
      return 0
    }

    const today = getTodayUTC()
    const yesterday = getDateMinusDays(today, 1)

    const firstDate = rows[0].date
    if (firstDate !== today && firstDate !== yesterday) {
      return 0
    }

    let streak = 1
    for (let i = 1; i < rows.length; i++) {
      const expectedDate = getDateMinusDays(rows[i - 1].date, 1)
      if (rows[i].date === expectedDate) {
        streak += 1
      } else {
        break
      }
    }

    return streak
  }

  getRecentProgress(userId: string, days: number): WritingProgress[] {
    const startDate = getDateMinusDays(getTodayUTC(), days - 1)

    const rows = this.db
      .prepare(
        `SELECT * FROM writing_progress
         WHERE user_id = ? AND date >= ?
         ORDER BY date DESC`
      )
      .all(userId, startDate) as ProgressRow[]

    return rows.map(rowToProgress)
  }
}

function getDateMinusDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}
