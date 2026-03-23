import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { CoachingPass, PassType, FocusDimension } from '@writting-buddy/shared'
import type {
  ICoachingPassRepository,
  CreateCoachingPassDto,
} from '../interfaces/coaching-pass-repository.js'

interface CoachingPassRow {
  id: string
  submission_id: string
  revision_number: number
  pass_type: string
  feedback: string
  focus_dimension: string | null
  llm_model: string | null
  llm_tokens_used: number | null
  created_at: string
}

function rowToCoachingPass(row: CoachingPassRow): CoachingPass {
  return {
    id: row.id,
    submissionId: row.submission_id,
    revisionNumber: row.revision_number,
    passType: row.pass_type as PassType,
    feedback: row.feedback,
    focusDimension: (row.focus_dimension as FocusDimension) ?? undefined,
    llmModel: row.llm_model ?? undefined,
    llmTokensUsed: row.llm_tokens_used ?? undefined,
    createdAt: row.created_at,
  }
}

export class SqliteCoachingPassRepository implements ICoachingPassRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findBySubmissionId(submissionId: string): CoachingPass[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM coaching_passes WHERE submission_id = ? ORDER BY created_at ASC'
      )
      .all(submissionId) as CoachingPassRow[]

    return rows.map(rowToCoachingPass)
  }

  create(data: CreateCoachingPassDto): CoachingPass {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db
      .prepare(
        `INSERT INTO coaching_passes
          (id, submission_id, revision_number, pass_type, feedback, focus_dimension, llm_model, llm_tokens_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.submissionId,
        data.revisionNumber,
        data.passType,
        data.feedback,
        data.focusDimension ?? null,
        data.llmModel ?? null,
        data.llmTokensUsed ?? null,
        now
      )

    const row = this.db
      .prepare('SELECT * FROM coaching_passes WHERE id = ?')
      .get(id) as CoachingPassRow | undefined

    if (!row) {
      throw new Error('Failed to create coaching pass')
    }

    return rowToCoachingPass(row)
  }

  countTodayByUserId(userId: string): number {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM coaching_passes cp
         JOIN submissions s ON cp.submission_id = s.id
         WHERE s.user_id = ?
           AND date(cp.created_at) = date('now')`
      )
      .get(userId) as { count: number }

    return row.count
  }

  sumTodayTokens(): number {
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(llm_tokens_used), 0) as total
         FROM coaching_passes
         WHERE date(created_at) = date('now')`
      )
      .get() as { total: number }

    return row.total
  }
}
