import type { User, CreateUserDto } from '@writing-buddy/shared'

export interface IUserRepository {
  findById(id: string): User | null
  findByEmail(email: string): User | null
  create(dto: CreateUserDto & { passwordHash: string }): User
  updateSubscription(userId: string, plan: string, status: string): User | null
}
