import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { logger } from '../services/logger.js'

export function createScoringRouter(db: Database): Router {
  const router = Router()

  const rubricScoresRepo = new SqliteRubricScoresRepository(db)
  const submissionRepo = new SqliteSubmissionRepository(db)

  router.get(
    '/:id/scores',
    requireAuth,
    (req: Request, res: Response) => {
      try {
        const submissionId = req.params.id as string
        const userId = req.user!.sub

        const submission = submissionRepo.findById(submissionId)
        if (!submission) {
          res.status(404).json({
            success: false,
            error: 'Submission not found',
          })
          return
        }

        if (submission.userId !== userId) {
          res.status(403).json({ success: false, error: 'Access denied' })
          return
        }

        const scores = rubricScoresRepo.findBySubmissionId(submissionId)
        if (!scores) {
          res.status(404).json({
            success: false,
            error: 'Scores not yet available for this submission',
          })
          return
        }

        res.json({ success: true, data: scores })
      } catch (error) {
        logger.error('Failed to get rubric scores', {
          error: String(error),
        })
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  return router
}
