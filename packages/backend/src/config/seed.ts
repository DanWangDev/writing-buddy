import type { Database } from 'better-sqlite3'
import { logger } from '../services/logger.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { seedPrompts } from '../data/seed-prompts.js'
import { seedPastPaperPrompts } from '../data/seed-past-paper-prompts.js'

function seedPromptData(db: Database): void {
  const promptRepo = new SqlitePromptRepository(db)
  const existingCount = promptRepo.count()

  if (existingCount > 0) {
    logger.debug('Prompts table already populated, skipping seed', { count: existingCount })
    return
  }

  const allPrompts = [...seedPrompts, ...seedPastPaperPrompts]
  logger.info('Seeding prompts table', { count: allPrompts.length })

  const insertMany = db.transaction(() => {
    for (const prompt of allPrompts) {
      promptRepo.create(prompt)
    }
  })

  insertMany()

  logger.info('Seed complete', { inserted: allPrompts.length })
}

export function seedDatabase(db: Database): void {
  seedPromptData(db)
}
