import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { Database } from 'better-sqlite3'
import type { User } from '@writing-buddy/shared'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'parent', 'tutor']),
  parentId: z.string().uuid().optional(),
})

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  plan: string
  apps: string[]
  features: string[]
  iat: number
  exp: number
}

interface RefreshTokenRow {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

const SALT_ROUNDS = 10

export class AuthService {
  private readonly userRepo: SqliteUserRepository
  private readonly db: Database

  constructor(db: Database) {
    this.db = db
    this.userRepo = new SqliteUserRepository(db)
  }

  async register(
    email: string,
    displayName: string,
    password: string,
    role: 'student' | 'parent' | 'tutor',
    parentId?: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const validated = registerSchema.parse({ email, displayName, password, role, parentId })

    const existing = this.userRepo.findByEmail(validated.email)
    if (existing) {
      throw new Error('Email already registered')
    }

    const passwordHash = await bcrypt.hash(validated.password, SALT_ROUNDS)

    const user = this.userRepo.create({
      email: validated.email,
      displayName: validated.displayName,
      password: validated.password,
      role: validated.role,
      parentId: validated.parentId,
      passwordHash,
    })

    const tokens = this.generateTokens(user)
    logger.info('User registered', { userId: user.id, email: user.email })

    return { user, tokens }
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const validated = loginSchema.parse({ email, password })

    const user = this.userRepo.findByEmail(validated.email)
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password')
    }

    const passwordValid = await bcrypt.compare(validated.password, user.passwordHash)
    if (!passwordValid) {
      throw new Error('Invalid email or password')
    }

    const tokens = this.generateTokens(user)
    logger.info('User logged in', { userId: user.id, email: user.email })

    return { user, tokens }
  }

  refreshToken(refreshTokenStr: string): { user: User; tokens: AuthTokens } {
    const validated = refreshSchema.parse({ refreshToken: refreshTokenStr })

    const row = this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ?'
    ).get(validated.refreshToken) as RefreshTokenRow | undefined

    if (!row) {
      throw new Error('Invalid refresh token')
    }

    if (new Date(row.expires_at) < new Date()) {
      this.db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(row.id)
      throw new Error('Refresh token expired')
    }

    const user = this.userRepo.findById(row.user_id)
    if (!user) {
      throw new Error('User not found')
    }

    this.db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(row.id)

    const tokens = this.generateTokens(user)
    logger.info('Token refreshed', { userId: user.id })

    return { user, tokens }
  }

  logout(refreshTokenStr: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshTokenStr)
    logger.info('User logged out')
  }

  generateTokens(user: User): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.subscriptionPlan,
      apps: ['writing'],
      features: [],
    }

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'],
    })

    const refreshTokenValue = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    this.db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), user.id, refreshTokenValue, expiresAt, new Date().toISOString())

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  }

  findUserById(id: string): User | null {
    return this.userRepo.findById(id)
  }
}
