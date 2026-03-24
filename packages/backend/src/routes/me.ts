import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../services/logger.js'

/**
 * Minimal auth routes -- replaces the old register/login/refresh/logout
 * with a single /me endpoint that reads claims from the hub JWT.
 */
export function createMeRouter(_db: Database): Router {
  const router = Router()

  router.get('/me', requireAuth, (req: Request, res: Response) => {
    try {
      const claims = req.user!

      res.json({
        success: true,
        data: {
          id: claims.sub,
          email: claims.email,
          displayName: claims.displayName,
          role: claims.role,
          plan: claims.plan,
          createdAt: '',
        },
      })
    } catch (error) {
      logger.error('Failed to get user info', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  return router
}
