import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'

export const writingRouter = Router()

writingRouter.use('/health', healthRouter)
writingRouter.use('/auth', authRouter)
