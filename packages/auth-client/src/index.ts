// Backend exports (Node.js safe — no DOM dependencies)
export { createAuthMiddleware } from './middleware.js'
export type { AuthMiddlewareOptions } from './middleware.js'
export { JwtVerifier } from './jwt-verifier.js'

// Shared types
export type { HubTokenClaims, AuthClientConfig, OidcEndpoints } from './types.js'
