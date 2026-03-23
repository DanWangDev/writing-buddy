import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5050', 10),
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../../data/writting-buddy.db'),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5179',
  CORS_EXTRA_ORIGINS: process.env.CORS_EXTRA_ORIGINS || '',
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY || '',
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'qwen-plus',
  DAILY_SPEND_CEILING: parseFloat(process.env.DAILY_SPEND_CEILING || '50'),
  FREE_TIER_DAILY_SESSIONS: parseInt(process.env.FREE_TIER_DAILY_SESSIONS || '3', 10),
} as const
