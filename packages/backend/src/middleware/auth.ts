import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '../services/auth-service.js'
import { AuthService } from '../services/auth-service.js'
import db from '../config/database.js'
import { logger } from '../services/logger.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieToken = req.cookies?.accessToken as string | undefined
  if (cookieToken) {
    return cookieToken
  }

  return null
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  try {
    const authService = new AuthService(db)
    const payload = authService.verifyAccessToken(token)
    req.user = payload
    next()
  } catch (error) {
    logger.warn('Invalid token', { error: String(error) })
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (!token) {
    next()
    return
  }

  try {
    const authService = new AuthService(db)
    const payload = authService.verifyAccessToken(token)
    req.user = payload
  } catch (error) {
    logger.debug('Optional auth failed', { error: String(error) })
  }

  next()
}
