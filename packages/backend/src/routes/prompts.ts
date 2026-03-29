import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Database } from 'better-sqlite3'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { requireAdmin } from '../middleware/auth.js'
import { logger } from '../services/logger.js'

const promptGenreSchema = z.enum([
  'adventure', 'mystery', 'sci-fi', 'fantasy', 'humor', 'descriptive', 'persuasive',
])

const promptDifficultySchema = z.enum(['beginner', 'standard', 'challenge'])

const promptQuerySchema = z.object({
  genre: promptGenreSchema.optional(),
  difficulty: promptDifficultySchema.optional(),
})

const createPromptSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(20).max(2000),
  genre: promptGenreSchema,
  difficulty: promptDifficultySchema,
  wordCountTarget: z.number().int().min(50).max(1000).optional(),
  timeLimitMinutes: z.number().int().min(5).max(120).optional(),
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
})

const updatePromptSchema = createPromptSchema.partial()

export function createPromptRouter(db: Database): Router {
  const router = Router()
  const promptRepo = new SqlitePromptRepository(db)

  // GET / — list active prompts (all authenticated users)
  router.get('/', (req: Request, res: Response) => {
    try {
      const parsed = promptQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => e.message)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const filters = parsed.data
      const prompts = promptRepo.findAll(filters)
      const total = promptRepo.count(filters)

      res.json({
        success: true,
        data: prompts,
        meta: { total },
      })
    } catch (error) {
      logger.error('Failed to list prompts', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  // GET /stats — admin heatmap + submission counts
  router.get('/stats', requireAdmin, (req: Request, res: Response) => {
    try {
      const heatmap = db.prepare(
        `SELECT genre, difficulty, COUNT(*) as count
         FROM prompts WHERE archived_at IS NULL
         GROUP BY genre, difficulty`
      ).all() as Array<{ genre: string; difficulty: string; count: number }>

      const submissionRows = db.prepare(
        `SELECT prompt_id, COUNT(*) as count
         FROM submissions
         GROUP BY prompt_id`
      ).all() as Array<{ prompt_id: string; count: number }>

      const submissionCounts: Record<string, number> = {}
      for (const row of submissionRows) {
        submissionCounts[row.prompt_id] = row.count
      }

      res.json({
        success: true,
        data: { heatmap, submissionCounts },
      })
    } catch (error) {
      logger.error('Failed to get prompt stats', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  // GET /:id — get prompt by ID (includes archived, for student submissions)
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const prompt = promptRepo.findById(req.params.id as string)

      if (!prompt) {
        res.status(404).json({ success: false, error: 'Prompt not found' })
        return
      }

      res.json({ success: true, data: prompt })
    } catch (error) {
      logger.error('Failed to get prompt', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  // POST / — create prompt (admin only)
  router.post('/', requireAdmin, (req: Request, res: Response) => {
    try {
      const parsed = createPromptSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const prompt = promptRepo.create(parsed.data)
      logger.info('Prompt created', { action: 'prompt_created', promptId: prompt.id, adminId: req.user?.sub })
      res.status(201).json({ success: true, data: prompt })
    } catch (error) {
      logger.error('Failed to create prompt', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  // PUT /:id — update prompt (admin only)
  router.put('/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const parsed = updatePromptSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const prompt = promptRepo.update(req.params.id as string, parsed.data)
      if (!prompt) {
        res.status(404).json({ success: false, error: 'Prompt not found' })
        return
      }

      logger.info('Prompt updated', { action: 'prompt_updated', promptId: prompt.id, adminId: req.user?.sub })
      res.json({ success: true, data: prompt })
    } catch (error) {
      logger.error('Failed to update prompt', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  // DELETE /:id — soft-delete prompt (admin only)
  router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const deleted = promptRepo.delete(req.params.id as string)
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Prompt not found' })
        return
      }

      logger.info('Prompt archived', { action: 'prompt_archived', promptId: req.params.id, adminId: req.user?.sub })
      res.status(204).send()
    } catch (error) {
      logger.error('Failed to delete prompt', { error: String(error) })
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })

  return router
}
