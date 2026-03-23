import { initializeDatabase, closeDatabase } from './database.js'
import { logger } from '../services/logger.js'

logger.info('Running migrations...')
initializeDatabase()
closeDatabase()
logger.info('Migrations complete')
