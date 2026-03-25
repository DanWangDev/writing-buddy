import jwt from 'jsonwebtoken'
import type { Database } from 'better-sqlite3'
import type { HubTokenClaims } from '@danwangdev/auth-client/types'
import { createHubAuth } from '../middleware/hub-auth.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { initAuth } from '../middleware/auth.js'

const TEST_JWT_SECRET = 'test-hub-secret-for-writing-buddy'

export interface TestUser {
  readonly token: string
  readonly claims: HubTokenClaims
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
  const now = Math.floor(Date.now() / 1000)
  const claims: HubTokenClaims = {
    sub: options.sub ?? '1',
    email: options.email ?? 'test@example.com',
    username: options.email?.split('@')[0] ?? 'testuser',
    displayName: options.displayName ?? 'Test User',
    role: options.role ?? 'student',
    plan: options.plan ?? 'free',
    features: options.features ?? [],
    apps: options.apps ?? ['writing-buddy'],
    iat: now,
    exp: now + 900,
  }

  const token = jwt.sign(
    {
      sub: claims.sub,
      email: claims.email,
      username: claims.username,
      display_name: claims.displayName,
      role: claims.role,
      plan: claims.plan,
      features: claims.features,
      apps: claims.apps,
    },
    TEST_JWT_SECRET,
    { expiresIn: '15m' },
  )

  return { token, claims }
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
 * Verifies a test token using the shared test secret.
 * Returns hub claims in the expected format.
 */
function verifyTestToken(token: string): HubTokenClaims {
  const payload = jwt.verify(token, TEST_JWT_SECRET) as Record<string, unknown>
  return {
    sub: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    username: String(payload.username ?? ''),
    displayName: String(payload.display_name ?? ''),
    role: String(payload.role ?? 'student'),
    plan: String(payload.plan ?? 'free'),
    features: Array.isArray(payload.features) ? payload.features.map(String) : [],
    apps: Array.isArray(payload.apps) ? payload.apps.map(String) : [],
    iat: typeof payload.iat === 'number' ? payload.iat : 0,
    exp: typeof payload.exp === 'number' ? payload.exp : 0,
  }
}

/**
 * Initializes the shared auth middleware for tests.
 * Call this in beforeEach after creating the test DB.
 */
export function initTestAuth(db: Database): void {
  const appUserRepo = new SqliteAppUserRepository(db)
  const syncUser = createUserSync(appUserRepo)

  const hubAuth = createHubAuth({
    verify: verifyTestToken,
    onAuthenticated: syncUser,
  })

  initAuth(hubAuth.requireAuth, hubAuth.optionalAuth)
}
