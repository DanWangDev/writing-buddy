import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import { PromptGeneratorService } from '../services/prompt-generator.js'
import type { GenerateMode } from '../services/prompt-generator.js'
import { DashScopeAdapter } from '../services/llm/dashscope-adapter.js'
import { env } from '../config/env.js'
import { logger } from '../services/logger.js'
import type { LLMProvider } from '../services/llm/provider.js'

const promptGenreSchema = z.enum([
  'adventure', 'mystery', 'sci-fi', 'fantasy', 'humor', 'descriptive', 'persuasive',
])

const promptDifficultySchema = z.enum(['beginner', 'standard', 'challenge'])

const generateRequestSchema = z.object({
  mode: z.enum(['full', 'refine_body', 'refine_title', 'suggest_tags']),
  genre: promptGenreSchema,
  difficulty: promptDifficultySchema,
  seed: z.string().max(500).optional(),
  current: z.string().max(2000).optional(),
})

function createDefaultProvider(): LLMProvider {
  if (!env.DASHSCOPE_API_KEY) {
    logger.warn('DASHSCOPE_API_KEY not set — prompt generation will use a no-op LLM provider')
    return {
      async generateResponse(): Promise<{ content: string; tokensUsed: number; model: string }> {
        throw new Error('LLM provider not configured')
      },
    }
  }
  return new DashScopeAdapter()
}

export function createPromptGenerateRouter(db: Database, llmProvider?: LLMProvider): Router {
  const router = Router()
  const provider = llmProvider ?? createDefaultProvider()
  const generator = new PromptGeneratorService(provider)

  // POST / — generate a prompt (admin only)
  router.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = generateRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const result = await generator.generate(parsed.data)

      logger.info('Prompt generated via AI', {
        action: 'prompt_generated',
        mode: parsed.data.mode,
        genre: parsed.data.genre,
        difficulty: parsed.data.difficulty,
        adminId: req.user?.sub,
        tokensUsed: result.tokensUsed,
      })

      res.json({ success: true, data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      logger.error('Prompt generation failed', { error: message })
      res.status(500).json({ success: false, error: message })
    }
  })

  return router
}
