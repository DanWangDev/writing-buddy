/**
 * Claims extracted from a hub-issued JWT access token.
 *
 * The hub's OIDC provider embeds these in the "hub" scope:
 *   sub, email, username, display_name, role, plan, features, apps
 */
export interface HubTokenClaims {
  /** Hub user ID (numeric string, e.g. "42") */
  readonly sub: string
  /** User email */
  readonly email: string
  /** Hub username */
  readonly username: string
  /** Display name */
  readonly displayName: string
  /** User role on the hub */
  readonly role: string
  /** Subscription plan: free | writing | vocab | bundle | family */
  readonly plan: string
  /** Feature entitlements from subscription */
  readonly features: readonly string[]
  /** App slugs the user has access to */
  readonly apps: readonly string[]
  /** Issued-at timestamp (seconds) */
  readonly iat: number
  /** Expiration timestamp (seconds) */
  readonly exp: number
}

export interface AuthClientConfig {
  /** Hub OIDC issuer URL, e.g. "https://hub.labf.app" */
  readonly issuer: string
  /** OIDC client_id for this application */
  readonly clientId: string
  /** OIDC client_secret for this application */
  readonly clientSecret: string
  /** Where the hub redirects after login */
  readonly redirectUri: string
  /** App slug used for entitlement checks (e.g. "writing-buddy") */
  readonly appSlug: string
  /** JWKS cache TTL in milliseconds (default: 10 minutes) */
  readonly jwksCacheTtlMs?: number
}

export interface OidcEndpoints {
  readonly authorization: string
  readonly token: string
  readonly userinfo: string
  readonly jwks: string
  readonly endSession: string
}
