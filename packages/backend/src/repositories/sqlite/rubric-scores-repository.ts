import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { RubricScores } from '@writing-buddy/shared'
import type {
  IRubricScoresRepository,
  CreateRubricScoresDto,
} from '../interfaces/rubric-scores-repository.js'

interface RubricScoresRow {
  id: string
  submission_id: string
  content: number
  organization: number
  vocabulary: number
  grammar: number
  spelling: number
  overall_score: number
  status: string
  llm_model: string | null
  llm_tokens_used: number | null
  created_at: string
}

function rowToRubricScores(row: RubricScoresRow): RubricScores {
  return {
    id: row.id,
    submissionId: row.submission_id,
    content: row.content,
    organization: row.organization,
    vocabulary: row.vocabulary,
    grammar: row.grammar,
    spelling: row.spelling,
    overallScore: row.overall_score,
    status: row.status as 'scored' | 'scoring_failed',
    llmModel: row.llm_model ?? undefined,
    llmTokensUsed: row.llm_tokens_used ?? undefined,
    createdAt: row.created_at,
  }
}

export class SqliteRubricScoresRepository implements IRubricScoresRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findBySubmissionId(submissionId: string): RubricScores | null {
    const row = this.db
      .prepare('SELECT * FROM rubric_scores WHERE submission_id = ?')
      .get(submissionId) as RubricScoresRow | undefined

    return row ? rowToRubricScores(row) : null
  }

  create(data: CreateRubricScoresDto): RubricScores {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db
      .prepare(
        `INSERT INTO rubric_scores
          (id, submission_id, content, organization, vocabulary, grammar, spelling, overall_score, status, llm_model, llm_tokens_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.submissionId,
        data.content,
        data.organization,
        data.vocabulary,
        data.grammar,
        data.spelling,
        data.overallScore,
        data.status,
        data.llmModel ?? null,
        data.llmTokensUsed ?? null,
        now
      )

    const row = this.db
      .prepare('SELECT * FROM rubric_scores WHERE id = ?')
      .get(id) as RubricScoresRow | undefined

    if (!row) {
      throw new Error('Failed to create rubric scores')
    }

    return rowToRubricScores(row)
  }
}
