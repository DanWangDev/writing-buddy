import type { Database } from 'better-sqlite3'
import { JwtVerifier } from '@labf/auth-client/server'
import { createHubAuth } from '../middleware/hub-auth.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { env } from '../config/env.js'

/**
 * Creates hub auth middleware with lazy user sync configured.
 * Uses the JwtVerifier from @labf/auth-client to verify hub JWTs
 * and syncs user data into the local app_users table.
 */
export function requireHubAuth(db: Database) {
  const appUserRepo = new SqliteAppUserRepository(db)
  const syncUser = createUserSync(appUserRepo)

  const verifier = new JwtVerifier({
    issuer: env.OIDC_ISSUER,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    redirectUri: env.OIDC_REDIRECT_URI,
    appSlug: 'writing-buddy',
  })

  return createHubAuth({
    verify: (token) => verifier.verify(token),
    onAuthenticated: syncUser,
  })
}
