import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { createPromptRouter } from './prompts.js'
import { createSubmissionRouter } from './submissions.js'
import { createCoachingRouter } from './coaching.js'
import { createScoringRouter } from './scoring.js'
import { createProgressRouter } from './progress.js'
import db from '../config/database.js'

export const writingRouter = Router()

writingRouter.use('/health', healthRouter)
writingRouter.use('/auth', authRouter)
writingRouter.use('/prompts', createPromptRouter(db))
writingRouter.use('/submissions', createSubmissionRouter(db))
writingRouter.use('/submissions', createCoachingRouter(db))
writingRouter.use('/submissions', createScoringRouter(db))
writingRouter.use('/progress', createProgressRouter(db))
