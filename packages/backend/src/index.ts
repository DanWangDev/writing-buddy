import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { createAuthRoutes } from '@danwangdev/auth-client/server'
import type { AuthServerConfig } from '@danwangdev/auth-client/server'
import { env } from './config/env.js'
import { initializeDatabase, closeDatabase } from './config/database.js'
import { logger } from './services/logger.js'
import { writingRouter } from './routes/index.js'
import { createMeRouter } from './routes/me.js'
import { initAuth } from './middleware/auth.js'
import db from './config/database.js'

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

// Auth configuration shared between routes and middleware
const authConfig: AuthServerConfig = {
  issuer: env.OIDC_ISSUER,
  internalIssuer: env.OIDC_INTERNAL_ISSUER,
  clientId: env.OIDC_CLIENT_ID,
  clientSecret: env.OIDC_CLIENT_SECRET,
  redirectUri: env.OIDC_REDIRECT_URI,
  postLogoutRedirectUri: env.CORS_ORIGIN,
  sessionSecret: env.SESSION_SECRET,
  backchannelLogout: true,
}

// Mount auth-client's OIDC routes (login, callback, logout, backchannel-logout)
const authRouter = createAuthRoutes({ ...authConfig, basePath: '/auth' })

// Initialize session-based auth middleware for domain routes
initAuth(authConfig, db)

// Custom /auth/me maps HubUser → PublicUser format (mounted first to take priority)
app.use('/api/auth', createMeRouter(db))
// Auth-client routes at /api/auth (login, callback, logout, backchannel-logout)
app.use('/api', authRouter)
// Domain routes
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
