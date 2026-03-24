import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { ProgressService } from '../services/progress-service.js'
import { logger } from '../services/logger.js'

const createSubmissionSchema = z.object({
  promptId: z.string().uuid().optional(),
})

const submissionQuerySchema = z.object({
  status: z.enum(['draft', 'in_coaching', 'completed']).optional(),
})

const createRevisionSchema = z.object({
  content: z.string().min(1, 'Content is required'),
})

const MIN_FIRST_REVISION_WORDS = 50

function countWords(content: string): number {
  return content.split(/\s+/).filter(token => token.length > 0).length
}

export function createSubmissionRouter(db: Database): Router {
  const router = Router()
  const submissionRepo = new SqliteSubmissionRepository(db)
  const revisionRepo = new SqliteRevisionRepository(db)
  const promptRepo = new SqlitePromptRepository(db)
  const progressRepo = new SqliteProgressRepository(db)
  const progressService = new ProgressService(progressRepo)

  router.post('/', requireAuth, (req: Request, res: Response) => {
    try {
      const parsed = createSubmissionSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => e.message)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const userId = req.user!.sub
      const submission = submissionRepo.create(userId, parsed.data.promptId)

      progressService.recordSubmissionActivity(userId)

      res.status(201).json({ success: true, data: submission })
    } catch (error) {
      logger.error('Failed to create submission', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.get('/', requireAuth, (req: Request, res: Response) => {
    try {
      const parsed = submissionQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => e.message)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const userId = req.user!.sub
      const submissions = submissionRepo.findByUserId(userId, parsed.data)

      const enriched = submissions.map((sub) => {
        const prompt = sub.promptId ? promptRepo.findById(sub.promptId) : null
        return { ...sub, promptTitle: prompt?.title }
      })

      res.json({ success: true, data: enriched })
    } catch (error) {
      logger.error('Failed to list submissions', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.get('/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const submission = submissionRepo.findById(id)

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }

      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }

      const revisions = revisionRepo.findBySubmissionId(id)
      const prompt = submission.promptId
        ? promptRepo.findById(submission.promptId)
        : null

      res.json({
        success: true,
        data: { ...submission, revisions, prompt: prompt ?? undefined },
      })
    } catch (error) {
      logger.error('Failed to get submission', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.post('/:id/revisions', requireAuth, (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const submission = submissionRepo.findById(id)

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }

      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }

      const parsed = createRevisionSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => e.message)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const { content } = parsed.data
      const existingCount = revisionRepo.countBySubmissionId(id)
      const wordCount = countWords(content)

      if (existingCount === 0 && wordCount < MIN_FIRST_REVISION_WORDS) {
        res.status(400).json({
          success: false,
          error: `Your first draft needs at least ${MIN_FIRST_REVISION_WORDS} words. You have ${wordCount} so far. Keep going!`,
        })
        return
      }

      const revision = revisionRepo.create(id, content)

      progressService.recordRevisionActivity(req.user!.sub, wordCount)

      res.status(201).json({ success: true, data: revision })
    } catch (error) {
      logger.error('Failed to create revision', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.patch('/:id/complete', requireAuth, (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const submission = submissionRepo.findById(id)

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }

      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }

      if (submission.status === 'completed') {
        res.status(400).json({ success: false, error: 'Submission is already completed' })
        return
      }

      const baseXp = 10
      const revisionCount = revisionRepo.countBySubmissionId(id)
      const xpEarned = baseXp + (revisionCount * 5)

      const completed = submissionRepo.complete(id, xpEarned)

      const userId = req.user!.sub
      progressService.awardXp(userId, xpEarned)
      progressService.updateStreakInProgress(userId)

      res.json({ success: true, data: completed })
    } catch (error) {
      logger.error('Failed to complete submission', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  router.delete('/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const submission = submissionRepo.findById(id)

      if (!submission) {
        res.status(404).json({ success: false, error: 'Submission not found' })
        return
      }

      if (submission.userId !== req.user!.sub) {
        res.status(403).json({ success: false, error: 'Access denied' })
        return
      }

      if (submission.status === 'completed') {
        res.status(400).json({ success: false, error: 'Cannot delete a completed submission' })
        return
      }

      submissionRepo.delete(id)

      res.json({ success: true, data: null })
    } catch (error) {
      logger.error('Failed to delete submission', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  return router
}
