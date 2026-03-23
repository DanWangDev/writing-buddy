import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { initializeDatabase, closeDatabase } from './config/database.js'
import { logger } from './services/logger.js'
import { writingRouter } from './routes/index.js'

const app = express()

app.use(helmet())
const allowedOrigins = [
  env.CORS_ORIGIN,
  ...env.CORS_EXTRA_ORIGINS.split(',').map(o => o.trim()).filter(Boolean),
]

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) ||
        allowedOrigins.some(allowed => allowed.startsWith('*.') &&
          origin.endsWith(allowed.slice(1)))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api/writing', writingRouter)

initializeDatabase()

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`, { env: env.NODE_ENV })
})

function shutdown(): void {
  logger.info('Shutting down gracefully...')
  server.close(() => {
    closeDatabase()
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export { app }
