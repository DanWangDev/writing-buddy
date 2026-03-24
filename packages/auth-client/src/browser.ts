// Frontend exports (requires DOM)
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

// Re-export shared types for convenience
export type { HubTokenClaims, AuthClientConfig, OidcEndpoints } from './types.js'
