import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { SqliteCoachingPassRepository } from '../repositories/sqlite/coaching-pass-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { SqliteProgressRepository } from '../repositories/sqlite/progress-repository.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { AiCoachService } from '../services/coaching/ai-coach.js'
import { RubricScorerService } from '../services/scoring/rubric-scorer.js'
import { ProgressService } from '../services/progress-service.js'
import { ContentSafetyService } from '../services/content-safety.js'
import { DashScopeAdapter } from '../services/llm/dashscope-adapter.js'
import { env } from '../config/env.js'
import { logger } from '../services/logger.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from '../services/llm/provider.js'

// Simple per-user daily counter for suggestion endpoints (apply + category-suggest)
const suggestionCounts = new Map<string, { count: number; date: string }>()

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function checkSuggestionLimit(userId: string, limit: number): boolean {
  const today = getTodayUTC()
  const entry = suggestionCounts.get(userId)
  if (!entry || entry.date !== today) {
    suggestionCounts.set(userId, { count: 1, date: today })
    return true
  }
  if (entry.count >= limit) {
    return false
  }
  entry.count += 1
  return true
}

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
  const userRepo = new SqliteUserRepository(db)
  const contentSafety = new ContentSafetyService()

  const provider: LLMProvider = llmProvider ?? createDefaultProvider()

  const aiCoach = new AiCoachService(
    provider,
    coachingPassRepo,
    submissionRepo,
    revisionRepo,
    promptRepo,
    userRepo,
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

        if (message.includes('temporarily unavailable') || message.includes('AI coach is temporarily')) {
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

  const applySuggestionsSchema = z.object({
    content: z.string().min(1),
    feedback: z.string().min(1),
    mode: z.enum(['grammar', 'vocabulary', 'improve']).default('improve'),
  })

  router.post(
    '/:id/apply',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const submissionId = req.params.id as string
        const userId = req.user!.sub

        const submission = submissionRepo.findById(submissionId)
        if (!submission) {
          res.status(404).json({ success: false, error: 'Submission not found' })
          return
        }

        if (submission.userId !== userId) {
          res.status(403).json({ success: false, error: 'Access denied' })
          return
        }

        const parsed = applySuggestionsSchema.safeParse(req.body)
        if (!parsed.success) {
          const messages = parsed.error.errors.map(e => e.message)
          res.status(400).json({ success: false, error: messages.join(', ') })
          return
        }

        const { content, feedback, mode } = parsed.data

        if (!checkSuggestionLimit(userId, env.DAILY_SUGGESTION_LIMIT)) {
          res.status(429).json({
            success: false,
            error: `You've used all your AI suggestions for today (${env.DAILY_SUGGESTION_LIMIT}). Come back tomorrow!`,
          })
          return
        }

        const modePrompts: Record<string, string> = {
          grammar: [
            'You are a careful copy editor for a student (age 10-11).',
            'Fix grammar, spelling, and punctuation errors in the student\'s writing.',
            'Do NOT change their voice, word choices, or sentence structure beyond fixing errors.',
            'Do NOT add new content or rewrite sentences.',
            'Return ONLY the corrected text. No explanations, no comments.',
          ].join('\n'),
          vocabulary: [
            'You are a vocabulary coach for a student (age 10-11) preparing for 11+ exams.',
            'Replace weak or overused words with more ambitious alternatives that fit the student\'s voice.',
            'Focus on: replacing "said" with speech verbs, replacing "nice/good/bad" with specific adjectives, upgrading common verbs.',
            'Keep the student\'s natural voice — don\'t make it sound adult.',
            'Return ONLY the improved text. No explanations, no comments.',
          ].join('\n'),
          improve: [
            'You are a writing coach for a student (age 10-11) preparing for 11+ creative writing exams.',
            'Apply the coaching suggestions below to improve the student\'s writing.',
            'Maintain the student\'s voice and style — make minimal changes that target the suggestions.',
            'Focus on: sensory details, show-don\'t-tell, varied sentence starters, ambitious vocabulary.',
            'Return ONLY the improved text. No explanations, no comments, no quotation marks around the text.',
          ].join('\n'),
        }

        const systemPrompt = modePrompts[mode] ?? modePrompts['improve']

        const userPrompt = mode === 'improve'
          ? `Coaching feedback to apply:\n${feedback}\n\nStudent's writing:\n${content}`
          : `Student's writing:\n${content}`

        const llmResponse = await provider.generateResponse(
          systemPrompt,
          userPrompt,
          { maxTokens: 2000, temperature: 0.3 }
        )

        const improvedContent = llmResponse.content.trim()

        // Safety check on output
        const screening = await contentSafety.filterOutput(improvedContent)
        if (!screening.safe) {
          res.status(422).json({
            success: false,
            error: 'The improved text could not be generated safely. Try again.',
          })
          return
        }

        res.json({
          success: true,
          data: {
            originalContent: content,
            improvedContent,
            mode,
            tokensUsed: llmResponse.tokensUsed,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error('Apply suggestions failed', { error: message })

        if (message.includes('temporarily unavailable') || message.includes('API')) {
          res.status(503).json({ success: false, error: 'AI is temporarily unavailable. Please try again.' })
          return
        }

        res.status(500).json({ success: false, error: 'Failed to apply suggestions.' })
      }
    }
  )

  const categorySuggestSchema = z.object({
    content: z.string().min(1),
    category: z.enum(['content', 'organization', 'vocabulary', 'grammar', 'spelling']),
  })

  const categoryPrompts: Record<string, string> = {
    content: [
      'You are a creative writing coach for a student (age 10-11) preparing for 11+ exams.',
      'Improve ONLY the content quality of this writing: ideas, creativity, depth of thought, and relevance.',
      'Add sensory details, show-don\'t-tell techniques, and deeper emotional engagement.',
      'Do NOT fix grammar, spelling, or reorganize the structure.',
      'Keep the student\'s natural voice — don\'t make it sound adult.',
      'Return ONLY the improved text. No explanations, no comments.',
    ].join('\n'),
    organization: [
      'You are a writing structure coach for a student (age 10-11) preparing for 11+ exams.',
      'Improve ONLY the organization: structure, flow, logical sequencing, and paragraphing.',
      'Add paragraph breaks where needed, improve transitions between ideas, ensure a clear beginning/middle/end.',
      'Do NOT change vocabulary, fix grammar, or add new content ideas.',
      'Keep the student\'s natural voice — don\'t make it sound adult.',
      'Return ONLY the improved text. No explanations, no comments.',
    ].join('\n'),
    vocabulary: [
      'You are a vocabulary coach for a student (age 10-11) preparing for 11+ exams.',
      'Improve ONLY the vocabulary: replace weak or overused words with more ambitious alternatives.',
      'Focus on: replacing "said" with speech verbs, replacing "nice/good/bad" with specific adjectives, upgrading common verbs.',
      'Do NOT fix grammar, reorganize structure, or add new content ideas.',
      'Keep the student\'s natural voice — don\'t make it sound adult.',
      'Return ONLY the improved text. No explanations, no comments.',
    ].join('\n'),
    grammar: [
      'You are a grammar coach for a student (age 10-11).',
      'Improve ONLY the grammar: sentence structure, subject-verb agreement, tense consistency, and punctuation.',
      'Do NOT change vocabulary, reorganize structure, or add new content ideas.',
      'Keep the student\'s natural voice — don\'t make it sound adult.',
      'Return ONLY the corrected text. No explanations, no comments.',
    ].join('\n'),
    spelling: [
      'You are a spelling coach for a student (age 10-11).',
      'Fix ONLY spelling errors in this writing. Do not change anything else.',
      'Do NOT fix grammar, change vocabulary, reorganize structure, or add content.',
      'Return ONLY the corrected text. No explanations, no comments.',
    ].join('\n'),
  }

  router.post(
    '/:id/category-suggest',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const submissionId = req.params.id as string
        const userId = req.user!.sub

        const submission = submissionRepo.findById(submissionId)
        if (!submission) {
          res.status(404).json({ success: false, error: 'Submission not found' })
          return
        }

        if (submission.userId !== userId) {
          res.status(403).json({ success: false, error: 'Access denied' })
          return
        }

        const parsed = categorySuggestSchema.safeParse(req.body)
        if (!parsed.success) {
          const messages = parsed.error.errors.map(e => e.message)
          res.status(400).json({ success: false, error: messages.join(', ') })
          return
        }

        const { content, category } = parsed.data

        if (!checkSuggestionLimit(userId, env.DAILY_SUGGESTION_LIMIT)) {
          res.status(429).json({
            success: false,
            error: `You've used all your AI suggestions for today (${env.DAILY_SUGGESTION_LIMIT}). Come back tomorrow!`,
          })
          return
        }

        const systemPrompt = categoryPrompts[category]
        const userPrompt = `Student's writing:\n${content}`

        const llmResponse = await provider.generateResponse(
          systemPrompt,
          userPrompt,
          { maxTokens: 2000, temperature: 0.3 }
        )

        const improvedContent = llmResponse.content.trim()

        const screening = await contentSafety.filterOutput(improvedContent)
        if (!screening.safe) {
          res.status(422).json({
            success: false,
            error: 'Suggestions could not be generated safely. Try again.',
          })
          return
        }

        res.json({
          success: true,
          data: {
            category,
            originalContent: content,
            improvedContent,
            tokensUsed: llmResponse.tokensUsed,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error('Category suggest failed', { error: message })

        if (message.includes('temporarily unavailable') || message.includes('API')) {
          res.status(503).json({ success: false, error: 'AI is temporarily unavailable. Please try again.' })
          return
        }

        res.status(500).json({ success: false, error: 'Failed to generate suggestions.' })
      }
    }
  )

  return router
}
