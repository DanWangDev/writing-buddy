import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { Prompt } from '@writing-buddy/shared'
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
}

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
  }
}

function buildWhereClause(filters?: PromptFilters): { clause: string; params: string[] } {
  const conditions: string[] = []
  const params: string[] = []

  if (filters?.genre) {
    conditions.push('genre = ?')
    params.push(filters.genre)
  }

  if (filters?.difficulty) {
    conditions.push('difficulty = ?')
    params.push(filters.difficulty)
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
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

  create(prompt: Omit<Prompt, 'id' | 'createdAt'>): Prompt {
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

  count(filters?: PromptFilters): number {
    const { clause, params } = buildWhereClause(filters)
    const row = this.db.prepare(
      `SELECT COUNT(*) as count FROM prompts ${clause}`
    ).get(...params) as { count: number }

    return row.count
  }
}
