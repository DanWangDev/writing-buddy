/**
 * User lookup interface used by domain services (e.g., coaching).
 * After hub auth migration, this reads from app_users table.
 */
export interface UserInfo {
  readonly id: string
  readonly displayName: string
  readonly email: string
  readonly role: string
}

export interface IUserRepository {
  findById(id: string): UserInfo | null
}
