export type UserRole = 'student' | 'parent' | 'tutor'

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

/**
 * @deprecated Use AppUser instead. Kept for migration period only.
 */
export interface User {
  id: string
  email: string
  displayName: string
  passwordHash?: string
  role: UserRole
  parentId?: string
  subscriptionPlan: string
  subscriptionStatus: string
  createdAt: string
  updatedAt: string
}

/**
 * @deprecated Registration now happens on the hub.
 */
export interface CreateUserDto {
  email: string
  displayName: string
  password: string
  role: UserRole
  parentId?: string
}
