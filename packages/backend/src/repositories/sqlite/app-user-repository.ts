import type { Database } from 'better-sqlite3'
import type { AppUser, IAppUserRepository } from '../interfaces/app-user-repository.js'

interface AppUserRow {
  hub_user_id: string
  display_name: string
  email: string
  role: string
  preferences: string
  created_at: string
  updated_at: string
}

function rowToAppUser(row: AppUserRow): AppUser {
  return {
    hubUserId: row.hub_user_id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    preferences: JSON.parse(row.preferences) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SqliteAppUserRepository implements IAppUserRepository {
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
  }

  findByHubUserId(hubUserId: string): AppUser | null {
    const row = this.db.prepare(
      'SELECT * FROM app_users WHERE hub_user_id = ?',
    ).get(hubUserId) as AppUserRow | undefined

    return row ? rowToAppUser(row) : null
  }

  upsert(
    hubUserId: string,
    displayName: string,
    email: string,
    role: string,
  ): AppUser {
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO app_users (hub_user_id, display_name, email, role, preferences, created_at, updated_at)
      VALUES (?, ?, ?, ?, '{}', ?, ?)
      ON CONFLICT(hub_user_id) DO UPDATE SET
        display_name = excluded.display_name,
        email = excluded.email,
        role = excluded.role,
        updated_at = excluded.updated_at
    `).run(hubUserId, displayName, email, role, now, now)

    const user = this.findByHubUserId(hubUserId)
    if (!user) {
      throw new Error('Failed to upsert app user')
    }
    return user
  }

  updatePreferences(
    hubUserId: string,
    preferences: Record<string, unknown>,
  ): AppUser | null {
    const now = new Date().toISOString()

    const result = this.db.prepare(`
      UPDATE app_users SET preferences = ?, updated_at = ? WHERE hub_user_id = ?
    `).run(JSON.stringify(preferences), now, hubUserId)

    if (result.changes === 0) {
      return null
    }

    return this.findByHubUserId(hubUserId)
  }
}
