import type { Database } from 'better-sqlite3'
import { logger } from '../services/logger.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { seedPrompts } from '../data/seed-prompts.js'

export function seedDatabase(db: Database): void {
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
