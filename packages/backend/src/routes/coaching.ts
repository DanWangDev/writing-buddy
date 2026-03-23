import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { requireAuth } from '../middleware/auth.js'
import { SqliteCoachingPassRepository } from '../repositories/sqlite/coaching-pass-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { AiCoachService } from '../services/coaching/ai-coach.js'
import { RubricScorerService } from '../services/scoring/rubric-scorer.js'
import { ProgressService } from '../services/progress-service.js'
import { ContentSafetyService } from '../services/content-safety.js'
import { DashScopeAdapter } from '../services/llm/dashscope-adapter.js'
import { env } from '../config/env.js'
import { logger } from '../services/logger.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from '../services/llm/provider.js'

function createDefaultProvider(): LLMProvider {
  if (!env.DASHSCOPE_API_KEY) {
    logger.warn('DASHSCOPE_API_KEY not set — coaching will use a no-op LLM provider')
    return {
      async generateResponse(
        _systemPrompt: string,
        _userPrompt: string,
        _options: LLMProviderOptions
      ): Promise<LLMResponse> {
        throw new Error('LLM provider not configured')
      },
    }
  }
  return new DashScopeAdapter()
}

export function createCoachingRouter(
  db: Database,
  llmProvider?: LLMProvider
): Router {
  const router = Router()

  const coachingPassRepo = new SqliteCoachingPassRepository(db)
  const submissionRepo = new SqliteSubmissionRepository(db)
  const revisionRepo = new SqliteRevisionRepository(db)
  const rubricScoresRepo = new SqliteRubricScoresRepository(db)
  const progressRepo = new SqliteProgressRepository(db)
  const promptRepo = new SqlitePromptRepository(db)
  const contentSafety = new ContentSafetyService()

  const provider: LLMProvider = llmProvider ?? createDefaultProvider()

  const aiCoach = new AiCoachService(
    provider,
    coachingPassRepo,
    submissionRepo,
    revisionRepo,
    contentSafety,
    {
      freeTierDailySessions: env.FREE_TIER_DAILY_SESSIONS,
      dailySpendCeiling: env.DAILY_SPEND_CEILING,
    }
  )

  const rubricScorer = new RubricScorerService(provider, rubricScoresRepo)
  const progressService = new ProgressService(progressRepo)

  router.post(
    '/:id/coach',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const submissionId = req.params.id as string
        const userId = req.user!.sub

        const coachingPass = await aiCoach.getNextPass(submissionId, userId)

        progressService.recordCoachingActivity(userId)

        let scores = undefined

        if (coachingPass.passType === 'polish') {
          try {
            const submission = submissionRepo.findById(submissionId)
            const revisions = revisionRepo.findBySubmissionId(submissionId)
            const latestRevision = revisions[revisions.length - 1]

            let promptBody = 'Free writing exercise'
            if (submission?.promptId) {
              const prompt = promptRepo.findById(submission.promptId)
              if (prompt) {
                promptBody = prompt.body
              }
            }

            scores = await rubricScorer.scoreSubmission(
              submissionId,
              latestRevision.content,
              promptBody
            )
          } catch (error) {
            logger.error('Rubric scoring failed during coaching', {
              submissionId,
              error: String(error),
            })
          }
        }

        const responseData = scores
          ? { ...coachingPass, scores }
          : coachingPass

        res.status(201).json({ success: true, data: responseData })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        if (
          message === 'Submission not found' ||
          message === 'No revisions found. Write something first!'
        ) {
          res.status(404).json({ success: false, error: message })
          return
        }

        if (message === 'Access denied') {
          res.status(403).json({ success: false, error: message })
          return
        }

        if (message === 'Submission is already completed') {
          res.status(400).json({ success: false, error: message })
          return
        }

        if (message.includes('Daily coaching limit')) {
          res.status(429).json({ success: false, error: message })
          return
        }

        if (message.includes('temporarily unavailable')) {
          res.status(503).json({ success: false, error: message })
          return
        }

        if (message.includes('content that needs review')) {
          res.status(422).json({ success: false, error: message })
          return
        }

        logger.error('Coaching pass failed', { error: message })
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  router.get(
    '/:id/coaching',
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

        const passes = coachingPassRepo.findBySubmissionId(submissionId)

        res.json({
          success: true,
          data: {
            submissionId,
            currentPass: passes.length,
            passes,
            isComplete: passes.length >= 4,
          },
        })
      } catch (error) {
        logger.error('Failed to get coaching passes', {
          error: String(error),
        })
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  return router
}
