import bcrypt from 'bcryptjs'
import type { Database } from 'better-sqlite3'
import { logger } from '../services/logger.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { seedPrompts } from '../data/seed-prompts.js'
import { env } from './env.js'

function seedPromptData(db: Database): void {
  const promptRepo = new SqlitePromptRepository(db)
  const existingCount = promptRepo.count()

  if (existingCount > 0) {
    logger.debug('Prompts table already populated, skipping seed', { count: existingCount })
    return
  }

  logger.info('Seeding prompts table', { count: seedPrompts.length })

  const insertMany = db.transaction(() => {
    for (const prompt of seedPrompts) {
      promptRepo.create(prompt)
    }
  })

  insertMany()

  logger.info('Seed complete', { inserted: seedPrompts.length })
}

function seedAdminUser(db: Database): void {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    logger.debug('No ADMIN_EMAIL/ADMIN_PASSWORD configured, skipping admin seed')
    return
  }

  const userRepo = new SqliteUserRepository(db)
  const existing = userRepo.findByEmail(env.ADMIN_EMAIL)

  if (existing) {
    logger.debug('Admin user already exists, skipping seed', { email: env.ADMIN_EMAIL })
    return
  }

  const passwordHash = bcrypt.hashSync(env.ADMIN_PASSWORD, 10)
  userRepo.create({
    email: env.ADMIN_EMAIL,
    displayName: 'Admin',
    password: env.ADMIN_PASSWORD,
    role: 'parent',
    passwordHash,
  })

  logger.info('Admin user seeded', { email: env.ADMIN_EMAIL })
}

export function seedDatabase(db: Database): void {
  seedPromptData(db)
  seedAdminUser(db)
}
