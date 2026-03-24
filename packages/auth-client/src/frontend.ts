import type { OidcEndpoints } from './types.js'

/**
 * Generates a cryptographically random string for PKCE code_verifier.
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Creates an S256 code_challenge from a code_verifier.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export interface OidcFrontendConfig {
  /** Hub issuer URL */
  readonly issuer: string
  /** OIDC client_id */
  readonly clientId: string
  /** Post-login redirect URI (on this app) */
  readonly redirectUri: string
  /** OIDC scopes to request */
  readonly scopes?: string
}

const STORAGE_PREFIX = 'labf_oidc_'
const CODE_VERIFIER_KEY = `${STORAGE_PREFIX}code_verifier`
const STATE_KEY = `${STORAGE_PREFIX}state`
const ACCESS_TOKEN_KEY = `${STORAGE_PREFIX}access_token`
const REFRESH_TOKEN_KEY = `${STORAGE_PREFIX}refresh_token`
const ID_TOKEN_KEY = `${STORAGE_PREFIX}id_token`

function discoverEndpoints(issuer: string): OidcEndpoints {
  return {
    authorization: `${issuer}/auth`,
    token: `${issuer}/token`,
    userinfo: `${issuer}/me`,
    jwks: `${issuer}/.well-known/jwks.json`,
    endSession: `${issuer}/session/end`,
  }
}

/**
 * Redirects the browser to the hub's OIDC authorize endpoint.
 */
export async function startLogin(config: OidcFrontendConfig): Promise<void> {
  const endpoints = discoverEndpoints(config.issuer)
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateCodeVerifier().slice(0, 16)

  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes ?? 'openid profile email hub',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  window.location.href = `${endpoints.authorization}?${params.toString()}`
}

export interface TokenResponse {
  readonly accessToken: string
  readonly refreshToken: string | null
  readonly idToken: string | null
  readonly expiresIn: number
}

/**
 * Exchanges an authorization code for tokens (callback handler).
 */
export async function handleCallback(
  config: OidcFrontendConfig,
  callbackUrl: string,
): Promise<TokenResponse> {
  const url = new URL(callbackUrl)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    const description = url.searchParams.get('error_description') ?? errorParam
    throw new Error(`OIDC error: ${description}`)
  }

  if (!code) {
    throw new Error('No authorization code in callback URL')
  }

  const savedState = sessionStorage.getItem(STATE_KEY)
  if (state !== savedState) {
    throw new Error('State mismatch — possible CSRF attack')
  }

  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
  if (!codeVerifier) {
    throw new Error('No code verifier found — login flow may have been interrupted')
  }

  const endpoints = discoverEndpoints(config.issuer)

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  })

  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Token exchange failed: ${errorBody}`)
  }

  const data = await response.json() as {
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in: number
  }

  // Clean up PKCE state
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)

  const tokens: TokenResponse = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    idToken: data.id_token ?? null,
    expiresIn: data.expires_in,
  }

  // Persist tokens
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }
  if (tokens.idToken) {
    localStorage.setItem(ID_TOKEN_KEY, tokens.idToken)
  }

  return tokens
}

/**
 * Refreshes the access token using the stored refresh token.
 */
export async function refreshAccessToken(
  config: OidcFrontendConfig,
): Promise<TokenResponse | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    return null
  }

  const endpoints = discoverEndpoints(config.issuer)

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  })

  try {
    const response = await fetch(endpoints.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = await response.json() as {
      access_token: string
      refresh_token?: string
      id_token?: string
      expires_in: number
    }

    const tokens: TokenResponse = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      idToken: data.id_token ?? null,
      expiresIn: data.expires_in,
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    }

    return tokens
  } catch {
    return null
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ID_TOKEN_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
}

/**
 * Redirects to hub's end-session endpoint for logout.
 */
export function startLogout(config: OidcFrontendConfig, postLogoutUri?: string): void {
  const endpoints = discoverEndpoints(config.issuer)
  const idToken = localStorage.getItem(ID_TOKEN_KEY)

  clearTokens()

  const params = new URLSearchParams()
  if (idToken) {
    params.set('id_token_hint', idToken)
  }
  if (postLogoutUri) {
    params.set('post_logout_redirect_uri', postLogoutUri)
  }

  window.location.href = `${endpoints.endSession}?${params.toString()}`
}
