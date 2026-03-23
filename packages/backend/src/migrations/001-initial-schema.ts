import type { Migration } from '../config/migrator.js'

export const initialSchema: Migration = {
  name: '001-initial-schema',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'tutor')),
        parent_id TEXT REFERENCES users(id),
        subscription_plan TEXT NOT NULL DEFAULT 'free',
        subscription_status TEXT NOT NULL DEFAULT 'trial',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        genre TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'standard', 'challenge')),
        word_count_target INTEGER,
        time_limit_minutes INTEGER,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
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
        user_id TEXT NOT NULL REFERENCES users(id),
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

    db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_revisions_submission_id ON revisions(submission_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_coaching_passes_submission_id ON coaching_passes(submission_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_writing_progress_user_id ON writing_progress(user_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission_id ON rubric_scores(submission_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`)
  },
  down: (db) => {
    db.exec('DROP TABLE IF EXISTS refresh_tokens')
    db.exec('DROP TABLE IF EXISTS rubric_scores')
    db.exec('DROP TABLE IF EXISTS challenges')
    db.exec('DROP TABLE IF EXISTS writing_progress')
    db.exec('DROP TABLE IF EXISTS coaching_passes')
    db.exec('DROP TABLE IF EXISTS revisions')
    db.exec('DROP TABLE IF EXISTS submissions')
    db.exec('DROP TABLE IF EXISTS prompts')
    db.exec('DROP TABLE IF EXISTS users')
  },
}
