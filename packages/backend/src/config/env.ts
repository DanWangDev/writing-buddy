import dotenv from 'dotenv'
import path from 'path'
import { existsSync } from 'fs'

function findEnvFile(): string {
  let dir = process.cwd()
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, '.env')
    if (existsSync(candidate)) return candidate
    dir = path.dirname(dir)
  }
  return path.resolve(process.cwd(), '.env')
}

dotenv.config({ path: findEnvFile(), override: true })

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5050', 10),
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../../data/writing-buddy.db'),

  // Hub OIDC configuration
  // OIDC_ISSUER: public issuer URL (must match JWT `iss` claim)
  // OIDC_INTERNAL_ISSUER: used for discovery/JWKS fetch when the public URL
  //   isn't reachable (e.g. inside Docker, use http://host.docker.internal:3009)
  OIDC_ISSUER: process.env.OIDC_ISSUER || 'http://localhost:3009',
  OIDC_INTERNAL_ISSUER: process.env.OIDC_INTERNAL_ISSUER || process.env.OIDC_ISSUER || 'http://localhost:3009',
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || 'writing-buddy-client',
  OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || '',
  OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI || 'http://localhost:5179/api/writing/auth/callback',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production-32chars!',

  // Legacy JWT secret — used only in tests
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5179',
  CORS_EXTRA_ORIGINS: process.env.CORS_EXTRA_ORIGINS || '',
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY || '',
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'qwen-plus',
  DAILY_SPEND_CEILING: parseFloat(process.env.DAILY_SPEND_CEILING || '50'),
  FREE_TIER_DAILY_SESSIONS: parseInt(process.env.FREE_TIER_DAILY_SESSIONS || '3', 10),
  DAILY_SUGGESTION_LIMIT: parseInt(process.env.DAILY_SUGGESTION_LIMIT || '20', 10),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
} as const
