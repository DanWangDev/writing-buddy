import type { Migration } from '../config/migrator.js'
import crypto from 'crypto'
import { env } from '../config/env.js'

/**
 * Derives an AES-256-GCM encryption key from SESSION_SECRET.
 */
function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(env.SESSION_SECRET).digest()
}

function encrypt(plaintext: string): string {
  const key = deriveKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export const llmConfigMigration: Migration = {
  name: '004-llm-config',
  up: (db) => {
    // ── llm_providers ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS llm_providers (
        id            TEXT PRIMARY KEY,
        catalog_id    TEXT NOT NULL,
        name          TEXT NOT NULL,
        adapter       TEXT NOT NULL DEFAULT 'openai-compatible',
        base_url      TEXT NOT NULL,
        api_key       TEXT NOT NULL,
        custom_models TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    // ── llm_config ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS llm_config (
        id           TEXT PRIMARY KEY,
        feature      TEXT NOT NULL UNIQUE,
        provider_id  TEXT NOT NULL REFERENCES llm_providers(id),
        model        TEXT NOT NULL,
        temperature  REAL NOT NULL DEFAULT 0.7,
        max_tokens   INTEGER NOT NULL DEFAULT 800,
        enabled      INTEGER NOT NULL DEFAULT 1,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    db.exec(`CREATE INDEX IF NOT EXISTS idx_llm_config_feature ON llm_config(feature)`)

    // ── Seed from env vars (only if table is empty) ──
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM llm_providers').get() as { count: number }
    if (existingCount.count > 0) return

    const apiKey = env.DASHSCOPE_API_KEY || ''
    if (!apiKey) {
      // No key configured — seed the provider row with empty key,
      // admin can fill it in via the UI
      db.prepare(`
        INSERT INTO llm_providers (id, catalog_id, name, adapter, base_url, api_key)
        VALUES (?, ?, ?, ?, ?, '')
      `).run(
        crypto.randomUUID(),
        'dashscope',
        'DashScope (Qwen)',
        'openai-compatible',
        env.LLM_BASE_URL,
      )
    } else {
      const encryptedKey = encrypt(apiKey)
      db.prepare(`
        INSERT INTO llm_providers (id, catalog_id, name, adapter, base_url, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        'dashscope',
        'DashScope (Qwen)',
        'openai-compatible',
        env.LLM_BASE_URL,
        encryptedKey,
      )
    }

    // Get the provider ID we just inserted
    const providerRow = db.prepare('SELECT id FROM llm_providers LIMIT 1').get() as { id: string }
    const providerId = providerRow.id

    // Seed default feature configs
    const features = [
      { feature: 'coaching', model: 'qwen-plus', temperature: 0.7, maxTokens: 800 },
      { feature: 'scoring', model: 'qwen-plus', temperature: 0.1, maxTokens: 100 },
      { feature: 'apply_suggestions', model: 'qwen-plus', temperature: 0.3, maxTokens: 2000 },
      { feature: 'category_suggestions', model: 'qwen-plus', temperature: 0.3, maxTokens: 2000 },
      { feature: 'prompt_generation', model: 'qwen-plus', temperature: 0.8, maxTokens: 800 },
    ]

    const insertConfig = db.prepare(`
      INSERT INTO llm_config (id, feature, provider_id, model, temperature, max_tokens)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const fc of features) {
      insertConfig.run(crypto.randomUUID(), fc.feature, providerId, fc.model, fc.temperature, fc.maxTokens)
    }
  },
  down: (db) => {
    db.exec(`DROP TABLE IF EXISTS llm_config`)
    db.exec(`DROP TABLE IF EXISTS llm_providers`)
  },
}
