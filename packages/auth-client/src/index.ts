// Backend exports
export { createAuthMiddleware } from './middleware.js'
export type { AuthMiddlewareOptions } from './middleware.js'
export { JwtVerifier } from './jwt-verifier.js'

// Frontend exports
export {
  startLogin,
  handleCallback,
  refreshAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  clearTokens,
  startLogout,
} from './frontend.js'
export type { OidcFrontendConfig, TokenResponse } from './frontend.js'

// Shared types
export type { HubTokenClaims, AuthClientConfig, OidcEndpoints } from './types.js'
