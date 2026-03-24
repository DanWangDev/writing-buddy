import type { Request, Response, NextFunction } from 'express'
import type { HubTokenClaims } from '@labf/auth-client'

/**
 * Re-exports for backward compatibility with domain routes.
 *
 * The actual auth middleware is created lazily using the database
 * instance, since domain routes need the same middleware with
 * lazy user sync. See `initAuth()` below.
 */

declare global {
  namespace Express {
    interface Request {
      user?: HubTokenClaims
    }
  }
}

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>

let _requireAuth: AuthMiddleware | null = null
let _optionalAuth: AuthMiddleware | null = null

/**
 * Initialize the auth middleware with the hub auth functions.
 * Must be called once at app startup before routes handle requests.
 */
export function initAuth(
  requireAuth: AuthMiddleware,
  optionalAuth: AuthMiddleware,
): void {
  _requireAuth = requireAuth
  _optionalAuth = optionalAuth
}

/**
 * Middleware that requires a valid hub JWT.
 * Sets req.user to HubTokenClaims.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!_requireAuth) {
    res.status(500).json({ success: false, error: 'Auth middleware not initialized' })
    return
  }
  void _requireAuth(req, res, next)
}

/**
 * Middleware that optionally attaches hub JWT claims if present.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!_optionalAuth) {
    next()
    return
  }
  void _optionalAuth(req, res, next)
}
