import type { Database } from 'better-sqlite3'
import { logger } from '../services/logger.js'
import { SqlitePromptRepository } from '../repositories/sqlite/prompt-repository.js'
import { seedPrompts } from '../data/seed-prompts.js'
import { seedPastPaperPrompts } from '../data/seed-past-paper-prompts.js'

function seedCorePrompts(db: Database): void {
  const promptRepo = new SqlitePromptRepository(db)
  const existingCount = promptRepo.count()

  if (existingCount > 0) {
    logger.debug('Prompts table already populated, skipping core seed', { count: existingCount })
    return
  }

  logger.info('Seeding core prompts', { count: seedPrompts.length })

  const insertMany = db.transaction(() => {
    for (const prompt of seedPrompts) {
      promptRepo.create(prompt)
    }
  })

  insertMany()

  logger.info('Core seed complete', { inserted: seedPrompts.length })
}

function seedPastPaperPromptsData(db: Database): void {
  const promptRepo = new SqlitePromptRepository(db)

  logger.info('Checking past-paper prompts for new entries', { available: seedPastPaperPrompts.length })

  let inserted = 0
  let skipped = 0

  const insertNew = db.transaction(() => {
    for (const prompt of seedPastPaperPrompts) {
      const existing = promptRepo.findByTitle(prompt.title)
      if (existing) {
        skipped++
        continue
      }
      promptRepo.create(prompt)
      inserted++
    }
  })

  insertNew()

  logger.info('Past-paper seed complete', { inserted, skipped })
}

export function seedDatabase(db: Database): void {
  seedCorePrompts(db)
  seedPastPaperPromptsData(db)
}
