import type { Migration } from '../config/migrator.js'

export const promptAdminMigration: Migration = {
  name: '003-prompt-admin',
  up: (db) => {
    db.exec(`ALTER TABLE prompts ADD COLUMN updated_at DATETIME DEFAULT NULL`)
    db.exec(`ALTER TABLE prompts ADD COLUMN archived_at DATETIME DEFAULT NULL`)
    db.exec(`CREATE INDEX idx_prompts_archived ON prompts(archived_at) WHERE archived_at IS NULL`)
  },
  down: (db) => {
    db.exec(`DROP INDEX IF EXISTS idx_prompts_archived`)
    db.exec(`ALTER TABLE prompts DROP COLUMN archived_at`)
    db.exec(`ALTER TABLE prompts DROP COLUMN updated_at`)
  },
}
