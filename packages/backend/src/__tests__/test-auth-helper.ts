import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import type { Database } from 'better-sqlite3'
import type { HubUser } from '@danwangdev/auth-client/types'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { setAuthMiddleware } from '../middleware/auth.js'

const TEST_JWT_SECRET = 'test-hub-secret-for-writing-buddy'

export interface TestUser {
  readonly token: string
  readonly user: HubUser
}

export interface CreateTestUserOptions {
  readonly sub?: string
  readonly email?: string
  readonly displayName?: string
  readonly role?: string
  readonly plan?: string
  readonly features?: string[]
  readonly apps?: string[]
}

/**
 * Creates a hub-format JWT for testing.
 * Uses HS256 with a shared secret for simplicity in tests.
 */
export function createTestToken(options: CreateTestUserOptions = {}): TestUser {
  const user: HubUser = {
    sub: options.sub ?? '1',
    email: options.email ?? 'test@example.com',
    username: options.email?.split('@')[0] ?? 'testuser',
    display_name: options.displayName ?? 'Test User',
    email_verified: true,
    role: options.role ?? 'student',
    plan: options.plan ?? 'free',
    features: options.features ?? [],
    apps: options.apps ?? ['writing-buddy'],
    expires_at: null,
  }

  const token = jwt.sign(
    {
      sub: user.sub,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      plan: user.plan,
      features: user.features,
      apps: user.apps,
    },
    TEST_JWT_SECRET,
    { expiresIn: '15m' },
  )

  return { token, user }
}

/**
 * Creates an expired hub-format JWT for testing.
 */
export function createExpiredTestToken(options: CreateTestUserOptions = {}): string {
  return jwt.sign(
    {
      sub: options.sub ?? '1',
      email: options.email ?? 'test@example.com',
      username: 'testuser',
      display_name: options.displayName ?? 'Test User',
      role: options.role ?? 'student',
      plan: options.plan ?? 'free',
      features: options.features ?? [],
      apps: options.apps ?? ['writing-buddy'],
    },
    TEST_JWT_SECRET,
    { expiresIn: '-1s' },
  )
}

/**
 * Verifies a test token and returns HubUser.
 */
function verifyTestToken(token: string): HubUser {
  const payload = jwt.verify(token, TEST_JWT_SECRET) as Record<string, unknown>
  return {
    sub: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    username: String(payload.username ?? ''),
    display_name: String(payload.display_name ?? ''),
    email_verified: true,
    role: String(payload.role ?? 'student'),
    plan: String(payload.plan ?? 'free'),
    features: Array.isArray(payload.features) ? payload.features.map(String) : [],
    apps: Array.isArray(payload.apps) ? payload.apps.map(String) : [],
    expires_at: null,
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return req.cookies?.accessToken as string ?? null
}

/**
 * Initializes the shared auth middleware for tests.
 * Uses Bearer token verification (JWT) instead of session cookies.
 */
export function initTestAuth(db: Database): void {
  const appUserRepo = new SqliteAppUserRepository(db)
  const syncUser = createUserSync(appUserRepo)

  function testRequireAuth(req: Request, res: Response, next: NextFunction): void {
    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }
    try {
      const user = verifyTestToken(token)
      req.user = user
      try { syncUser(user) } catch { /* ignore */ }
      next()
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
  }

  function testOptionalAuth(req: Request, res: Response, next: NextFunction): void {
    const token = extractToken(req)
    if (token) {
      try {
        const user = verifyTestToken(token)
        req.user = user
        try { syncUser(user) } catch { /* ignore */ }
      } catch { /* ignore */ }
    }
    next()
  }

  setAuthMiddleware(testRequireAuth, testOptionalAuth)
}
