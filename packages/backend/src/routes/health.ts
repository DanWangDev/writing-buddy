import { Router } from 'express'
import type { Request, Response } from 'express'
import db from '../config/database.js'

export const healthRouter = Router()

healthRouter.get('/', (_req: Request, res: Response) => {
  try {
    const result = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined
    const dbHealthy = result?.ok === 1

    res.json({
      success: true,
      data: {
        status: dbHealthy ? 'healthy' : 'degraded',
        version: process.env.npm_package_version || '0.1.0',
        uptime: process.uptime(),
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    })
  } catch {
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
    })
  }
})
