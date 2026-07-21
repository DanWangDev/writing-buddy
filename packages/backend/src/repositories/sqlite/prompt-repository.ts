import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Prompt, UpdatePromptDto } from '@writing-buddy/shared'
import type { IPromptRepository, PromptFilters } from '../interfaces/prompt-repository.js'

interface PromptRow {
  id: string
  title: string
  body: string
  genre: string
  difficulty: string
  word_count_target: number | null
  time_limit_minutes: number | null
  tags: string
  created_at: string
  updated_at: string | null
  archived_at: string | null
}

/** Whitelist mapping DTO fields to DB column names (defense-in-depth against SQL injection) */
const COLUMN_MAP: Record<string, string> = {
  title: 'title',
  body: 'body',
  genre: 'genre',
  difficulty: 'difficulty',
  wordCountTarget: 'word_count_target',
  timeLimitMinutes: 'time_limit_minutes',
  tags: 'tags',
} as const

function rowToPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    genre: row.genre as Prompt['genre'],
    difficulty: row.difficulty as Prompt['difficulty'],
    wordCountTarget: row.word_count_target ?? undefined,
    timeLimitMinutes: row.time_limit_minutes ?? undefined,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
  }
}

function buildWhereClause(filters?: PromptFilters): { clause: string; params: string[] } {
  const conditions: string[] = ['archived_at IS NULL']
  const params: string[] = []

  if (filters?.genre) {
    conditions.push('genre = ?')
    params.push(filters.genre)
  }

  if (filters?.difficulty) {
    conditions.push('difficulty = ?')
    params.push(filters.difficulty)
  }

  const clause = `WHERE ${conditions.join(' AND ')}`
  return { clause, params }
}

export class SqlitePromptRepository implements IPromptRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findAll(filters?: PromptFilters): Prompt[] {
    const { clause, params } = buildWhereClause(filters)
    const rows = this.db.prepare(
      `SELECT * FROM prompts ${clause} ORDER BY created_at DESC`
    ).all(...params) as PromptRow[]

    return rows.map(rowToPrompt)
  }

  findById(id: string): Prompt | null {
    const row = this.db.prepare(
      'SELECT * FROM prompts WHERE id = ?'
    ).get(id) as PromptRow | undefined

    return row ? rowToPrompt(row) : null
  }

  create(prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>): Prompt {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO prompts (id, title, body, genre, difficulty, word_count_target, time_limit_minutes, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      prompt.title,
      prompt.body,
      prompt.genre,
      prompt.difficulty,
      prompt.wordCountTarget ?? null,
      prompt.timeLimitMinutes ?? null,
      JSON.stringify(prompt.tags),
      now
    )

    const created = this.findById(id)
    if (!created) {
      throw new Error('Failed to create prompt')
    }
    return created
  }

  update(id: string, data: UpdatePromptDto): Prompt | null {
    const sets: string[] = []
    const params: unknown[] = []

    for (const [key, value] of Object.entries(data)) {
      const column = COLUMN_MAP[key]
      if (!column || value === undefined) continue

      sets.push(`${column} = ?`)
      params.push(key === 'tags' ? JSON.stringify(value) : value)
    }

    if (sets.length === 0) {
      return this.findById(id)
    }

    sets.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    const result = this.db.prepare(
      `UPDATE prompts SET ${sets.join(', ')} WHERE id = ? AND archived_at IS NULL`
    ).run(...params)

    if (result.changes === 0) return null
    return this.findById(id)
  }

  delete(id: string): boolean {
    const result = this.db.prepare(
      'UPDATE prompts SET archived_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id)
    return result.changes > 0
  }

  findByTitle(title: string): Prompt | null {
    const row = this.db.prepare(
      'SELECT * FROM prompts WHERE title = ? AND archived_at IS NULL LIMIT 1'
    ).get(title) as PromptRow | undefined

    return row ? rowToPrompt(row) : null
  }

  count(filters?: PromptFilters): number {
    const { clause, params } = buildWhereClause(filters)
    const row = this.db.prepare(
      `SELECT COUNT(*) as count FROM prompts ${clause}`
    ).get(...params) as { count: number }

    return row.count
  }
}
