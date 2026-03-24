import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Revision } from '@writing-buddy/shared'
import type { IRevisionRepository } from '../interfaces/revision-repository.js'

interface RevisionRow {
  id: string
  submission_id: string
  revision_number: number
  content: string
  word_count: number
  created_at: string
}

function rowToRevision(row: RevisionRow): Revision {
  return {
    id: row.id,
    submissionId: row.submission_id,
    revisionNumber: row.revision_number,
    content: row.content,
    wordCount: row.word_count,
    createdAt: row.created_at,
  }
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(token => token.length > 0).length
}

export class SqliteRevisionRepository implements IRevisionRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findBySubmissionId(submissionId: string): Revision[] {
    const rows = this.db.prepare(
      'SELECT * FROM revisions WHERE submission_id = ? ORDER BY revision_number ASC'
    ).all(submissionId) as RevisionRow[]

    return rows.map(rowToRevision)
  }

  findLatest(submissionId: string): Revision | null {
    const row = this.db.prepare(
      'SELECT * FROM revisions WHERE submission_id = ? ORDER BY revision_number DESC LIMIT 1'
    ).get(submissionId) as RevisionRow | undefined

    return row ? rowToRevision(row) : null
  }

  create(submissionId: string, content: string): Revision {
    const latest = this.findLatest(submissionId)
    if (latest && latest.content === content) {
      return latest
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const wordCount = countWords(content)
    const existingCount = this.countBySubmissionId(submissionId)
    const revisionNumber = existingCount + 1

    this.db.prepare(`
      INSERT INTO revisions (id, submission_id, revision_number, content, word_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, submissionId, revisionNumber, content, wordCount, now)

    this.db.prepare(
      'UPDATE submissions SET current_revision = ?, word_count = ? WHERE id = ?'
    ).run(revisionNumber, wordCount, submissionId)

    const row = this.db.prepare(
      'SELECT * FROM revisions WHERE id = ?'
    ).get(id) as RevisionRow | undefined

    if (!row) {
      throw new Error('Failed to create revision')
    }
    return rowToRevision(row)
  }

  countBySubmissionId(submissionId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM revisions WHERE submission_id = ?'
    ).get(submissionId) as { count: number }

    return row.count
  }
}
