export type UserRole = 'student' | 'parent' | 'tutor'

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

export interface CreateUserDto {
  email: string
  displayName: string
  password: string
  role: UserRole
  parentId?: string
}

export interface PublicUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  subscriptionPlan: string
  createdAt: string
}
