import type { Database } from 'better-sqlite3'
import { discoverOidc, verifyIdToken } from '@danwangdev/auth-client/server'
import type { HubTokenClaims } from '@danwangdev/auth-client/types'
import { createHubAuth } from '../middleware/hub-auth.js'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { env } from '../config/env.js'

/**
 * Creates hub auth middleware with lazy user sync configured.
 * Uses OIDC discovery + verifyIdToken from @danwangdev/auth-client
 * to verify hub JWTs against the discovered JWKS endpoint.
 */
export function requireHubAuth(db: Database) {
  const appUserRepo = new SqliteAppUserRepository(db)
  const syncUser = createUserSync(appUserRepo)

  const verify = async (token: string): Promise<HubTokenClaims> => {
    // Use internal URL for discovery (reachable from Docker), public URL for JWT issuer validation.
    // The discovered jwks_uri uses the public issuer hostname which may be unreachable from Docker,
    // so rewrite it to use the internal hostname when they differ.
    const metadata = await discoverOidc(env.OIDC_INTERNAL_ISSUER)
    const jwksUri = env.OIDC_INTERNAL_ISSUER !== env.OIDC_ISSUER
      ? metadata.jwks_uri.replace(env.OIDC_ISSUER, env.OIDC_INTERNAL_ISSUER)
      : metadata.jwks_uri
    const user = await verifyIdToken(token, jwksUri, env.OIDC_ISSUER, env.OIDC_CLIENT_ID)
    return {
      sub: user.sub,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      plan: user.plan,
      features: user.features,
      apps: user.apps,
      iat: 0,
      exp: 0,
    }
  }

  return createHubAuth({
    verify,
    onAuthenticated: syncUser,
  })
}
