import { Router } from 'express'
import { healthRouter } from './health.js'
import { createPromptRouter } from './prompts.js'
import { createPromptGenerateRouter } from './prompt-generate.js'
import { createSubmissionRouter } from './submissions.js'
import { createCoachingRouter } from './coaching.js'
import { createScoringRouter } from './scoring.js'
import { createProgressRouter } from './progress.js'
import { createAdminLlmConfigRouter } from './admin-llm-config.js'
import { LlmConfigStore } from '../services/llm/llm-config-store.js'
import { LlmProviderFactory } from '../services/llm/llm-provider-factory.js'
import db from '../config/database.js'

function createLlmFactory(): LlmProviderFactory {
  const configStore = new LlmConfigStore(db)
  return new LlmProviderFactory(configStore)
}

export const writingRouter = Router()

writingRouter.use('/health', healthRouter)
// Mount generate BEFORE prompts so /prompts/generate doesn't match /prompts/:id
writingRouter.use('/prompts/generate', createPromptGenerateRouter(db, createLlmFactory))
writingRouter.use('/prompts', createPromptRouter(db))
writingRouter.use('/submissions', createSubmissionRouter(db))
writingRouter.use('/submissions', createCoachingRouter(db, createLlmFactory))
writingRouter.use('/submissions', createScoringRouter(db))
writingRouter.use('/progress', createProgressRouter(db))

// Admin routes
writingRouter.use('/admin/llm-config', createAdminLlmConfigRouter(new LlmConfigStore(db)))
