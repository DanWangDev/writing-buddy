import type { Migration } from '../config/migrator.js'
import { initialSchema } from './001-initial-schema.js'

export const migrations: Migration[] = [
  initialSchema,
]
