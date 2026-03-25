import type { Request, Response, NextFunction } from 'express'
import type { HubTokenClaims } from '@labf/auth-client/types'
import { logger } from '../services/logger.js'

/**
 * Hub JWT claims attached to Express requests after authentication.
 *
 * For backwards compatibility with existing route handlers that use
 * `req.user.sub`, we maintain the same interface shape.
 */
declare global {
  namespace Express {
    interface Request {
      user?: HubTokenClaims
    }
  }
}

export type TokenVerifier = (token: string) => Promise<HubTokenClaims> | HubTokenClaims

export interface HubAuthOptions {
  /**
   * Function that verifies a JWT and returns hub claims.
   * In production, this uses the auth-client JwtVerifier.
   * In tests, this can use a simple jwt.verify with a shared secret.
   */
  readonly verify: TokenVerifier

  /**
   * Called after successful verification for lazy user sync.
   */
  readonly onAuthenticated?: (claims: HubTokenClaims) => void | Promise<void>
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieToken = req.cookies?.accessToken as string | undefined
  if (cookieToken) {
    return cookieToken
  }

  return null
}

export function createHubAuth(options: HubAuthOptions) {
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
      const claims = await options.verify(token)
      req.user = claims

      if (options.onAuthenticated) {
        await options.onAuthenticated(claims)
      }

      next()
    } catch (error) {
      logger.warn('Invalid hub token', { error: String(error) })
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
      const claims = await options.verify(token)
      req.user = claims

      if (options.onAuthenticated) {
        await options.onAuthenticated(claims)
      }
    } catch (error) {
      logger.debug('Optional hub auth failed', { error: String(error) })
    }

    next()
  }

  return { requireAuth, optionalAuth }
}
