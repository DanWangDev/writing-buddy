import type { Migration } from '../config/migrator.js'

/**
 * Migration: Replace standalone auth with hub-based auth.
 *
 * This is a clean-slate migration (no production data).
 * - Drops: users table, refresh_tokens table
 * - Creates: app_users table (hub_user_id keyed)
 * - Recreates: domain tables with TEXT user_id referencing hub_user_id
 *
 * The hub issues JWTs with a numeric `sub` claim (stringified).
 * All user_id columns now store that hub user ID as TEXT.
 */
export const hubAuthMigration: Migration = {
  name: '002-hub-auth-migration',
  up: (db) => {
    // Drop old auth tables and domain tables that reference users
    db.exec('DROP TABLE IF EXISTS refresh_tokens')
    db.exec('DROP TABLE IF EXISTS rubric_scores')
    db.exec('DROP TABLE IF EXISTS coaching_passes')
    db.exec('DROP TABLE IF EXISTS writing_progress')
    db.exec('DROP TABLE IF EXISTS revisions')
    db.exec('DROP TABLE IF EXISTS submissions')
    db.exec('DROP TABLE IF EXISTS challenges')
    db.exec('DROP TABLE IF EXISTS users')

    // Create app_users table — lightweight local record per hub user
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_users (
        hub_user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'student',
        preferences TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Recreate domain tables with user_id as TEXT (hub_user_id)
    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt_id TEXT REFERENCES prompts(id),
        current_revision INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_coaching', 'completed')),
        word_count INTEGER NOT NULL DEFAULT 0,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        xp_earned INTEGER NOT NULL DEFAULT 0
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id),
        revision_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        word_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS coaching_passes (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id),
        revision_number INTEGER NOT NULL,
        pass_type TEXT NOT NULL CHECK (pass_type IN ('acknowledgment', 'guiding_questions', 'suggestions', 'polish')),
        feedback TEXT NOT NULL,
        focus_dimension TEXT,
        llm_model TEXT,
        llm_tokens_used INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS writing_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        submissions_count INTEGER NOT NULL DEFAULT 0,
        revisions_count INTEGER NOT NULL DEFAULT 0,
        words_written INTEGER NOT NULL DEFAULT 0,
        coaching_sessions INTEGER NOT NULL DEFAULT 0,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        streak_days INTEGER NOT NULL DEFAULT 0,
        UNIQUE (user_id, date)
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        prompt_id TEXT REFERENCES prompts(id),
        challenge_type TEXT NOT NULL,
        starts_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL,
        xp_reward INTEGER NOT NULL DEFAULT 0
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS rubric_scores (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id),
        content INTEGER NOT NULL,
        organization INTEGER NOT NULL,
        vocabulary INTEGER NOT NULL,
        grammar INTEGER NOT NULL,
        spelling INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('scored', 'scoring_failed')),
        llm_model TEXT,
        llm_tokens_used INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Recreate indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_revisions_submission_id ON revisions(submission_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_coaching_passes_submission_id ON coaching_passes(submission_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_writing_progress_user_id ON writing_progress(user_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission_id ON rubric_scores(submission_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email)')
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS rubric_scores')
    db.exec('DROP TABLE IF EXISTS challenges')
    db.exec('DROP TABLE IF EXISTS writing_progress')
    db.exec('DROP TABLE IF EXISTS coaching_passes')
    db.exec('DROP TABLE IF EXISTS revisions')
    db.exec('DROP TABLE IF EXISTS submissions')
    db.exec('DROP TABLE IF EXISTS app_users')
  },
}
