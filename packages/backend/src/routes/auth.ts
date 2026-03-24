import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { AuthService } from '../services/auth-service.js'
import { requireAuth } from '../middleware/auth.js'
import db from '../config/database.js'
import { logger } from '../services/logger.js'
import type { PublicUser } from '@writing-buddy/shared'

export const authRouter = Router()

function toPublicUser(user: { id: string; email: string; displayName: string; role: string; subscriptionPlan: string; createdAt: string }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role as PublicUser['role'],
    subscriptionPlan: user.subscriptionPlan,
    createdAt: user.createdAt,
  }
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof ZodError) {
    const messages = error.errors.map(e => e.message)
    res.status(400).json({ success: false, error: messages.join(', ') })
    return
  }

  const message = error instanceof Error ? error.message : 'Internal server error'

  if (message === 'Email already registered') {
    res.status(409).json({ success: false, error: message })
    return
  }

  if (message === 'Invalid email or password') {
    res.status(401).json({ success: false, error: message })
    return
  }

  if (message === 'Invalid refresh token' || message === 'Refresh token expired') {
    res.status(401).json({ success: false, error: message })
    return
  }

  logger.error('Unhandled auth error', { error: String(error) })
  res.status(500).json({ success: false, error: 'Internal server error' })
}

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const authService = new AuthService(db)
    const { email, displayName, password, role, parentId } = req.body as {
      email: string
      displayName: string
      password: string
      role: 'student' | 'parent' | 'tutor'
      parentId?: string
    }

    const { user, tokens } = await authService.register(email, displayName, password, role, parentId)

    res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    })
  } catch (error) {
    handleError(error, res)
  }
})

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const authService = new AuthService(db)
    const { email, password } = req.body as { email: string; password: string }

    const { user, tokens } = await authService.login(email, password)

    res.json({
      success: true,
      data: {
        user: toPublicUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    })
  } catch (error) {
    handleError(error, res)
  }
})

authRouter.post('/refresh', (req: Request, res: Response) => {
  try {
    const authService = new AuthService(db)
    const { refreshToken } = req.body as { refreshToken: string }

    const { user, tokens } = authService.refreshToken(refreshToken)

    res.json({
      success: true,
      data: {
        user: toPublicUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    })
  } catch (error) {
    handleError(error, res)
  }
})

authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  try {
    const authService = new AuthService(db)
    const { refreshToken } = req.body as { refreshToken: string }

    if (refreshToken) {
      authService.logout(refreshToken)
    }

    res.json({ success: true })
  } catch (error) {
    handleError(error, res)
  }
})

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  try {
    const authService = new AuthService(db)
    const user = authService.findUserById(req.user!.sub)

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    res.json({
      success: true,
      data: toPublicUser(user),
    })
  } catch (error) {
    handleError(error, res)
  }
})
