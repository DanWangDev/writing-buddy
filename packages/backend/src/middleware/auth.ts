import type { Request, Response, NextFunction } from 'express'
import type { Database } from 'better-sqlite3'
import {
  discoverOidc,
  requireAuth as acRequireAuth,
  optionalAuth as acOptionalAuth,
} from '@danwangdev/auth-client/server'
import type { AuthServerConfig } from '@danwangdev/auth-client/server'
import type { HubUser } from '@danwangdev/auth-client/types'
import { SqliteAppUserRepository } from '../repositories/sqlite/app-user-repository.js'
import { createUserSync } from '../services/user-sync.js'
import { logger } from '../services/logger.js'

declare global {
  namespace Express {
    interface Request {
      user?: HubUser
    }
  }
}

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>

let _requireAuth: AuthMiddleware | null = null
let _optionalAuth: AuthMiddleware | null = null
let _syncUser: ((user: HubUser) => void) | null = null

/**
 * Initialize session-based auth middleware using auth-client.
 * Lazily discovers OIDC metadata on first request (cached by auth-client).
 */
export function initAuth(config: AuthServerConfig, db: Database): void {
  const appUserRepo = new SqliteAppUserRepository(db)
  _syncUser = createUserSync(appUserRepo)

  let cachedMiddleware: { require: AuthMiddleware; optional: AuthMiddleware } | null = null

  async function getMiddleware(): Promise<{ require: AuthMiddleware; optional: AuthMiddleware }> {
    if (!cachedMiddleware) {
      // discoverOidc handles URL rewriting for Docker internal networking:
      // browser-facing endpoints use public issuer, server-to-server use internalIssuer
      const metadata = await discoverOidc(config.issuer, config.internalIssuer)
      cachedMiddleware = {
        require: acRequireAuth({ config, metadata }),
        optional: acOptionalAuth({ config, metadata }),
      }
    }
    return cachedMiddleware
  }

  _requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mw = await getMiddleware()
      mw.require(req, res, (err?: unknown) => {
        if (err) { next(err); return }
        // Sync user to local DB after successful auth
        if (req.user && _syncUser) {
          try { _syncUser(req.user) } catch { /* logged in syncUser */ }
        }
        next()
      })
    } catch (error) {
      logger.error('Auth middleware init failed', { error: String(error) })
      res.status(401).json({ success: false, error: 'Authentication failed' })
    }
  }

  _optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mw = await getMiddleware()
      mw.optional(req, res, (err?: unknown) => {
        if (err) { next(err); return }
        if (req.user && _syncUser) {
          try { _syncUser(req.user) } catch { /* logged in syncUser */ }
        }
        next()
      })
    } catch {
      next()
    }
  }
}

/**
 * Set auth middleware directly (used by tests to inject mock auth).
 */
export function setAuthMiddleware(
  require: AuthMiddleware,
  optional: AuthMiddleware,
): void {
  _requireAuth = require
  _optionalAuth = optional
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!_requireAuth) {
    res.status(500).json({ success: false, error: 'Auth middleware not initialized' })
    return
  }
  void _requireAuth(req, res, next)
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!_optionalAuth) {
    next()
    return
  }
  void _optionalAuth(req, res, next)
}
