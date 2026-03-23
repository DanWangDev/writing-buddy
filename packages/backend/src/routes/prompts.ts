import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Database } from 'better-sqlite3'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { logger } from '../services/logger.js'

const promptQuerySchema = z.object({
  genre: z.enum(['adventure', 'mystery', 'sci-fi', 'fantasy', 'humor', 'descriptive', 'persuasive']).optional(),
  difficulty: z.enum(['beginner', 'standard', 'challenge']).optional(),
})

export function createPromptRouter(db: Database): Router {
  const router = Router()
  const promptRepo = new SqlitePromptRepository(db)

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

  router.get('/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const prompt = promptRepo.findById(id)

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

  return router
}
