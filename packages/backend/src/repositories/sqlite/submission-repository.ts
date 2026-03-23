import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Submission, SubmissionStatus } from '@writting-buddy/shared'
import type { ISubmissionRepository, SubmissionFilters } from '../interfaces/submission-repository.js'

interface SubmissionRow {
  id: string
  user_id: string
  prompt_id: string | null
  current_revision: number
  status: string
  word_count: number
  started_at: string
  completed_at: string | null
  xp_earned: number
}

function rowToSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    userId: row.user_id,
    promptId: row.prompt_id ?? undefined,
    currentRevision: row.current_revision,
    status: row.status as SubmissionStatus,
    wordCount: row.word_count,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    xpEarned: row.xp_earned,
  }
}

export class SqliteSubmissionRepository implements ISubmissionRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findById(id: string): Submission | null {
    const row = this.db.prepare(
      'SELECT * FROM submissions WHERE id = ?'
    ).get(id) as SubmissionRow | undefined

    return row ? rowToSubmission(row) : null
  }

  findByUserId(userId: string, filters?: SubmissionFilters): Submission[] {
    const conditions = ['user_id = ?']
    const params: string[] = [userId]

    if (filters?.status) {
      conditions.push('status = ?')
      params.push(filters.status)
    }

    const rows = this.db.prepare(
      `SELECT * FROM submissions WHERE ${conditions.join(' AND ')} ORDER BY started_at DESC`
    ).all(...params) as SubmissionRow[]

    return rows.map(rowToSubmission)
  }

  create(userId: string, promptId?: string): Submission {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO submissions (id, user_id, prompt_id, current_revision, status, word_count, started_at, xp_earned)
      VALUES (?, ?, ?, 1, 'draft', 0, ?, 0)
    `).run(id, userId, promptId ?? null, now)

    const created = this.findById(id)
    if (!created) {
      throw new Error('Failed to create submission')
    }
    return created
  }

  updateStatus(id: string, status: SubmissionStatus): Submission | null {
    const result = this.db.prepare(
      'UPDATE submissions SET status = ? WHERE id = ?'
    ).run(status, id)

    if (result.changes === 0) {
      return null
    }

    return this.findById(id)
  }

  updateWordCount(id: string, wordCount: number): Submission | null {
    const result = this.db.prepare(
      'UPDATE submissions SET word_count = ? WHERE id = ?'
    ).run(wordCount, id)

    if (result.changes === 0) {
      return null
    }

    return this.findById(id)
  }

  complete(id: string, xpEarned: number): Submission | null {
    const now = new Date().toISOString()

    const result = this.db.prepare(
      'UPDATE submissions SET status = ?, completed_at = ?, xp_earned = ? WHERE id = ?'
    ).run('completed', now, xpEarned, id)

    if (result.changes === 0) {
      return null
    }

    return this.findById(id)
  }
}
