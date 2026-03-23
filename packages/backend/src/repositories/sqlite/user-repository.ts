import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import type { User, CreateUserDto } from '@writting-buddy/shared'
import type { IUserRepository } from '../interfaces/user-repository.js'

interface UserRow {
  id: string
  email: string
  display_name: string
  password_hash: string
  role: 'student' | 'parent' | 'tutor'
  parent_id: string | null
  subscription_plan: string
  subscription_status: string
  created_at: string
  updated_at: string
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role,
    parentId: row.parent_id ?? undefined,
    subscriptionPlan: row.subscription_plan,
    subscriptionStatus: row.subscription_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SqliteUserRepository implements IUserRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findById(id: string): User | null {
    const row = this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(id) as UserRow | undefined

    return row ? rowToUser(row) : null
  }

  findByEmail(email: string): User | null {
    const row = this.db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email) as UserRow | undefined

    return row ? rowToUser(row) : null
  }

  create(dto: CreateUserDto & { passwordHash: string }): User {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO users (id, email, display_name, password_hash, role, parent_id, subscription_plan, subscription_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'free', 'trial', ?, ?)
    `).run(id, dto.email, dto.displayName, dto.passwordHash, dto.role, dto.parentId ?? null, now, now)

    const user = this.findById(id)
    if (!user) {
      throw new Error('Failed to create user')
    }
    return user
  }

  updateSubscription(userId: string, plan: string, status: string): User | null {
    const now = new Date().toISOString()

    const result = this.db.prepare(`
      UPDATE users SET subscription_plan = ?, subscription_status = ?, updated_at = ? WHERE id = ?
    `).run(plan, status, now, userId)

    if (result.changes === 0) {
      return null
    }

    return this.findById(userId)
  }
}
