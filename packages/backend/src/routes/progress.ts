import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { ProgressService } from '../services/progress-service.js'
import { logger } from '../services/logger.js'

const progressQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 30))
    .pipe(z.number().int().min(1).max(365)),
})

export function createProgressRouter(db: Database): Router {
  const router = Router()

  const progressRepo = new SqliteProgressRepository(db)
  const progressService = new ProgressService(progressRepo)

  router.get(
    '/',
    requireAuth,
    (req: Request, res: Response) => {
      try {
        const parsed = progressQuerySchema.safeParse(req.query)
        if (!parsed.success) {
          const messages = parsed.error.errors.map(e => e.message)
          res.status(400).json({ success: false, error: messages.join(', ') })
          return
        }

        const userId = req.user!.sub
        const { days } = parsed.data

        const progress = progressRepo.getRecentProgress(userId, days)

        res.json({ success: true, data: progress })
      } catch (error) {
        logger.error('Failed to get progress', { error: String(error) })
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  router.get(
    '/streak',
    requireAuth,
    (req: Request, res: Response) => {
      try {
        const userId = req.user!.sub
        const streak = progressService.getStreakDays(userId)

        res.json({ success: true, data: { streakDays: streak } })
      } catch (error) {
        logger.error('Failed to get streak', { error: String(error) })
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  return router
}
