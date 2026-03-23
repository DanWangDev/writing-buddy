import { Router } from 'express'
import { healthRouter } from './health.js'

export const writingRouter = Router()

writingRouter.use('/health', healthRouter)
