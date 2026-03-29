export type UserRole = 'student' | 'parent' | 'tutor' | 'admin'

/**
 * App-local user record. Keyed by hub_user_id.
 * Contains only app-specific preferences, not auth data.
 */
export interface AppUser {
  hubUserId: string
  displayName: string
  email: string
  role: UserRole
  preferences: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Public user info returned by the /auth/me endpoint.
 * Claims come from the hub JWT; preferences from local app_users.
 */
export interface PublicUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  plan: string
  createdAt: string
}

