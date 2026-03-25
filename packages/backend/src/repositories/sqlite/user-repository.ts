import type { Database } from 'better-sqlite3'
import type { UserInfo, IUserRepository } from '../interfaces/user-repository.js'

interface AppUserRow {
  hub_user_id: string
  display_name: string
  email: string
  role: string
}

/**
 * Reads user info from the app_users table.
 * Used by domain services that need display name / role for context.
 */
export class SqliteUserRepository implements IUserRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findById(id: string): UserInfo | null {
    const row = this.db.prepare(
      'SELECT hub_user_id, display_name, email, role FROM app_users WHERE hub_user_id = ?',
    ).get(id) as AppUserRow | undefined

    if (!row) {
      return null
    }

    return {
      id: row.hub_user_id,
      displayName: row.display_name,
      email: row.email,
      role: row.role,
    }
  }
}
