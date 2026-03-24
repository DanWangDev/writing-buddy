export interface AppUser {
  readonly hubUserId: string
  readonly displayName: string
  readonly email: string
  readonly role: string
  readonly preferences: Record<string, unknown>
  readonly createdAt: string
  readonly updatedAt: string
}

export interface IAppUserRepository {
  findByHubUserId(hubUserId: string): AppUser | null
  upsert(hubUserId: string, displayName: string, email: string, role: string): AppUser
  updatePreferences(hubUserId: string, preferences: Record<string, unknown>): AppUser | null
}
