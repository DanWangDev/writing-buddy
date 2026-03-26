import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { logger } from '../services/logger.js'

/**
 * Minimal auth routes -- returns current user from session claims,
 * mapped to PublicUser format for the frontend.
 */
export function createMeRouter(_db: Database): Router {
  const router = Router()

  router.get('/me', requireAuth, (req: Request, res: Response) => {
    try {
      const user = req.user!

      res.json({
        success: true,
        data: {
          id: user.sub,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          plan: user.plan,
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
