import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Database } from 'better-sqlite3'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import { PromptGeneratorService } from '../services/prompt-generator.js'
import type { LlmProviderFactory } from '../services/llm/llm-provider-factory.js'
import { OpenAICompatibleAdapter } from '../services/llm/openai-compatible-adapter.js'
import { env } from '../config/env.js'
import { logger } from '../services/logger.js'

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

export function createPromptGenerateRouter(
  db: Database,
  getLlmFactory?: () => LlmProviderFactory,
): Router {
  const router = Router()

  // Lazy — only create the provider on first request
  let generator: PromptGeneratorService | null = null

  function getGenerator(): PromptGeneratorService {
    if (!generator) {
      const llmProvider = getLlmFactory
        ? getLlmFactory().getProvider('prompt_generation')
        : new OpenAICompatibleAdapter(env.LLM_BASE_URL, env.DASHSCOPE_API_KEY, env.LLM_MODEL)
      generator = new PromptGeneratorService(llmProvider)
    }
    return generator
  }

  // POST / — generate a prompt (admin only)
  router.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = generateRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        res.status(400).json({ success: false, error: messages.join(', ') })
        return
      }

      const result = await getGenerator().generate(parsed.data)

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
