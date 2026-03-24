import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { HubTokenClaims, AuthClientConfig } from './types.js'

/**
 * Verifies hub-issued JWTs using the hub's JWKS endpoint.
 * Caches the JWKS keyset for performance.
 */
export class JwtVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>
  private readonly issuer: string

  constructor(config: AuthClientConfig) {
    this.issuer = config.issuer
    const jwksUrl = new URL('/.well-known/jwks.json', config.issuer)

    this.jwks = createRemoteJWKSet(jwksUrl, {
      cacheMaxAge: config.jwksCacheTtlMs ?? 10 * 60 * 1000,
    })
  }

  async verify(token: string): Promise<HubTokenClaims> {
    const result = await jwtVerify(
      token,
      this.jwks,
      {
        issuer: this.issuer,
      },
    )

    const payload = result.payload

    return {
      sub: String(payload.sub ?? ''),
      email: String(payload.email ?? ''),
      username: String(payload.username ?? ''),
      displayName: String(payload.display_name ?? ''),
      role: String(payload.role ?? 'student'),
      plan: String(payload.plan ?? 'free'),
      features: Array.isArray(payload.features)
        ? payload.features.map(String)
        : [],
      apps: Array.isArray(payload.apps)
        ? payload.apps.map(String)
        : [],
      iat: typeof payload.iat === 'number' ? payload.iat : 0,
      exp: typeof payload.exp === 'number' ? payload.exp : 0,
    }
  }
}
