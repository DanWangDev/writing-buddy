import type { Request, Response, NextFunction } from 'express'
import type { HubTokenClaims, AuthClientConfig } from './types.js'
import { JwtVerifier } from './jwt-verifier.js'

declare global {
  namespace Express {
    interface Request {
      hubUser?: HubTokenClaims
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

export interface AuthMiddlewareOptions {
  /**
   * Optional callback invoked after successful token verification.
   * Use for lazy user sync (creating app_users records on first visit).
   */
  readonly onAuthenticated?: (claims: HubTokenClaims) => void | Promise<void>
}

/**
 * Creates Express middleware that verifies hub-issued JWTs.
 *
 * Returns two middleware functions:
 * - requireAuth: rejects requests without a valid hub JWT
 * - optionalAuth: attaches claims if token is present, continues otherwise
 */
export function createAuthMiddleware(
  config: AuthClientConfig,
  options: AuthMiddlewareOptions = {},
) {
  const verifier = new JwtVerifier(config)

  async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    try {
      const claims = await verifier.verify(token)
      req.hubUser = claims

      if (options.onAuthenticated) {
        await options.onAuthenticated(claims)
      }

      next()
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
  }

  async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractToken(req)
    if (!token) {
      next()
      return
    }

    try {
      const claims = await verifier.verify(token)
      req.hubUser = claims

      if (options.onAuthenticated) {
        await options.onAuthenticated(claims)
      }
    } catch {
      // Token invalid — continue without auth
    }

    next()
  }

  return { requireAuth, optionalAuth }
}
