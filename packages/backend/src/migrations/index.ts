import type { Migration } from '../config/migrator.js'
import { initialSchema } from './001-initial-schema.js'
import { hubAuthMigration } from './002-hub-auth-migration.js'
import { promptAdminMigration } from './003-prompt-admin.js'

export const migrations: Migration[] = [
  initialSchema,
  hubAuthMigration,
  promptAdminMigration,
]
