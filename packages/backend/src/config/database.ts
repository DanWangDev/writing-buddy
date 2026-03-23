import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { env } from './env.js'
import { logger } from '../services/logger.js'
import { Migrator } from './migrator.js'
import { migrations } from '../migrations/index.js'
import { seedDatabase } from './seed.js'

import type { Database as DatabaseType } from 'better-sqlite3'

const dataDir = path.dirname(env.DATABASE_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db: DatabaseType = new Database(env.DATABASE_PATH)

db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

export function initializeDatabase(): void {
  try {
    const migrator = new Migrator(db, migrations)
    migrator.migrate()
    seedDatabase(db)
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize database', { error: String(error) })
    process.exit(1)
  }
}

export function closeDatabase(): void {
  db.close()
}

export default db
