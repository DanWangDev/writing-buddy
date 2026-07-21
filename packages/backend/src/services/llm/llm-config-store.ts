import crypto from 'crypto'
import type { Database } from 'better-sqlite3'
import { env } from '../../config/env.js'
import { logger } from '../logger.js'
import { getModelsForProvider } from './llm-provider-catalog.js'

// ── Types ──

export type LlmFeature =
  | 'coaching'
  | 'scoring'
  | 'apply_suggestions'
  | 'category_suggestions'
  | 'prompt_generation'

export interface LlmProviderRow {
  id: string
  catalogId: string
  name: string
  adapter: string
  baseUrl: string
  apiKeyEncrypted: string
  customModels: string | null
  createdAt: string
  updatedAt: string
}

export interface LlmConfigRow {
  id: string
  feature: LlmFeature
  providerId: string
  model: string
  temperature: number
  maxTokens: number
  enabled: boolean
  updatedAt: string
}

export interface LlmProviderPublic {
  id: string
  catalogId: string
  name: string
  adapter: string
  baseUrl: string
  models: string[]
  apiKeyMasked: string
  createdAt: string
  updatedAt: string
}

// ── Encryption ──

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

function decrypt(encoded: string): string {
  const key = deriveKey()
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••'
  return key.slice(0, 4) + '••••' + key.slice(-4)
}

// ── Row mapping ──

interface ProviderQueryRow {
  id: string
  catalog_id: string
  name: string
  adapter: string
  base_url: string
  api_key: string
  custom_models: string | null
  created_at: string
  updated_at: string
}

interface ConfigQueryRow {
  id: string
  feature: string
  provider_id: string
  model: string
  temperature: number
  max_tokens: number
  enabled: number
  updated_at: string
}

// ── Store ──

export class LlmConfigStore {
  constructor(private readonly db: Database) {}

  // ═══ Providers ═══

  listProviders(): LlmProviderPublic[] {
    const rows = this.db.prepare(
      'SELECT * FROM llm_providers ORDER BY created_at ASC',
    ).all() as ProviderQueryRow[]

    return rows.map((row) => ({
      id: row.id,
      catalogId: row.catalog_id,
      name: row.name,
      adapter: row.adapter,
      baseUrl: row.base_url,
      models: getModelsForProvider(
        row.catalog_id,
        row.custom_models ? JSON.parse(row.custom_models) : undefined,
      ),
      apiKeyMasked: maskApiKey(this.decryptKey(row.api_key)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  getProvider(id: string): LlmProviderRow | null {
    const row = this.db.prepare(
      'SELECT * FROM llm_providers WHERE id = ?',
    ).get(id) as ProviderQueryRow | undefined
    if (!row) return null
    return {
      id: row.id,
      catalogId: row.catalog_id,
      name: row.name,
      adapter: row.adapter,
      baseUrl: row.base_url,
      apiKeyEncrypted: row.api_key,
      customModels: row.custom_models,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  decryptKey(encryptedKey: string): string {
    if (!encryptedKey) return ''
    try {
      return decrypt(encryptedKey)
    } catch (error) {
      logger.error('Failed to decrypt API key', { error: String(error) })
      return ''
    }
  }

  createProvider(data: {
    catalogId: string
    name: string
    adapter: string
    baseUrl: string
    apiKey: string
    customModels?: string[]
  }): LlmProviderPublic {
    const id = crypto.randomUUID()
    const encryptedKey = data.apiKey ? encrypt(data.apiKey) : ''
    const customModelsJson = data.customModels ? JSON.stringify(data.customModels) : null

    this.db.prepare(`
      INSERT INTO llm_providers (id, catalog_id, name, adapter, base_url, api_key, custom_models)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.catalogId, data.name, data.adapter, data.baseUrl, encryptedKey, customModelsJson)

    const created = this.toPublic(this.getProvider(id)!)
    logger.info('LLM provider created', { providerId: id, catalogId: data.catalogId })
    return created
  }

  updateProvider(id: string, data: {
    apiKey?: string
  }): LlmProviderPublic | null {
    const existing = this.getProvider(id)
    if (!existing) return null

    const sets: string[] = ['updated_at = datetime(\'now\')']
    const params: unknown[] = []

    if (data.apiKey !== undefined) {
      sets.push('api_key = ?')
      params.push(encrypt(data.apiKey))
    }

    params.push(id)

    this.db.prepare(
      `UPDATE llm_providers SET ${sets.join(', ')} WHERE id = ?`,
    ).run(...params)

    logger.info('LLM provider updated', { providerId: id })
    return this.toPublic(this.getProvider(id)!)
  }

  deleteProvider(id: string): boolean {
    // Check for references
    const refCount = this.db.prepare(
      'SELECT COUNT(*) as count FROM llm_config WHERE provider_id = ?',
    ).get(id) as { count: number }

    if (refCount.count > 0) {
      const features = this.db.prepare(
        'SELECT feature FROM llm_config WHERE provider_id = ?',
      ).all(id) as Array<{ feature: string }>
      const names = features.map((f) => f.feature).join(', ')
      throw new Error(`Cannot delete provider: still used by features: ${names}`)
    }

    const result = this.db.prepare('DELETE FROM llm_providers WHERE id = ?').run(id)
    if (result.changes > 0) {
      logger.info('LLM provider deleted', { providerId: id })
      return true
    }
    return false
  }

  // ═══ Feature Configs ═══

  listConfigs(): (LlmConfigRow & { providerName: string })[] {
    const rows = this.db.prepare(`
      SELECT c.*, p.name as provider_name
      FROM llm_config c
      JOIN llm_providers p ON c.provider_id = p.id
      ORDER BY c.feature ASC
    `).all() as Array<ConfigQueryRow & { provider_name: string }>

    return rows.map((row) => ({
      id: row.id,
      feature: row.feature as LlmFeature,
      providerId: row.provider_id,
      providerName: row.provider_name,
      model: row.model,
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      enabled: row.enabled === 1,
      updatedAt: row.updated_at,
    }))
  }

  getFeatureConfig(feature: LlmFeature): LlmConfigRow | null {
    const row = this.db.prepare(
      'SELECT * FROM llm_config WHERE feature = ?',
    ).get(feature) as ConfigQueryRow | undefined
    if (!row) return null
    return {
      id: row.id,
      feature: row.feature as LlmFeature,
      providerId: row.provider_id,
      model: row.model,
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      enabled: row.enabled === 1,
      updatedAt: row.updated_at,
    }
  }

  updateFeatureConfig(id: string, data: {
    providerId?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }): (LlmConfigRow & { providerName: string }) | null {
    const sets: string[] = ['updated_at = datetime(\'now\')']
    const params: unknown[] = []

    if (data.providerId !== undefined) {
      sets.push('provider_id = ?')
      params.push(data.providerId)
    }
    if (data.model !== undefined) {
      sets.push('model = ?')
      params.push(data.model)
    }
    if (data.temperature !== undefined) {
      sets.push('temperature = ?')
      params.push(data.temperature)
    }
    if (data.maxTokens !== undefined) {
      sets.push('max_tokens = ?')
      params.push(data.maxTokens)
    }

    params.push(id)

    const result = this.db.prepare(
      `UPDATE llm_config SET ${sets.join(', ')} WHERE id = ?`,
    ).run(...params)

    if (result.changes === 0) return null

    logger.info('LLM feature config updated', { configId: id })
    return this.listConfigs().find((c) => c.id === id) ?? null
  }

  // ── Helpers ──

  private toPublic(row: LlmProviderRow): LlmProviderPublic {
    const decrypted = this.decryptKey(row.apiKeyEncrypted)
    return {
      id: row.id,
      catalogId: row.catalogId,
      name: row.name,
      adapter: row.adapter,
      baseUrl: row.baseUrl,
      models: getModelsForProvider(
        row.catalogId,
        row.customModels ? JSON.parse(row.customModels) : undefined,
      ),
      apiKeyMasked: maskApiKey(decrypted),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
