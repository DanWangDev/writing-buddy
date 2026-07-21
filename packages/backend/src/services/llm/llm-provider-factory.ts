import type { LLMProvider, LLMProviderOptions } from './provider.js'
import { OpenAICompatibleAdapter } from './openai-compatible-adapter.js'
import { ClaudeAdapter } from './claude-adapter.js'
import { LlmConfigStore } from './llm-config-store.js'
import type { LlmFeature } from './llm-config-store.js'
import { env } from '../../config/env.js'
import { logger } from '../logger.js'

/**
 * Centralized factory that creates LLMProvider instances from database configuration.
 * Falls back to environment variables if no DB config exists for a feature.
 */
export class LlmProviderFactory {
  constructor(private readonly configStore: LlmConfigStore) {}

  /**
   * Returns a fully configured LLMProvider for the given feature.
   * Reads from DB on every call — changes take effect immediately.
   */
  getProvider(feature: LlmFeature): LLMProvider {
    const config = this.configStore.getFeatureConfig(feature)

    if (!config) {
      // Fallback: no DB config yet — use env vars directly
      logger.warn('No LLM config found for feature, falling back to env vars', { feature })
      return this.createEnvFallback()
    }

    const provider = this.configStore.getProvider(config.providerId)
    if (!provider) {
      logger.warn('Provider not found for feature, falling back to env vars', { feature, providerId: config.providerId })
      return this.createEnvFallback()
    }

    const apiKey = this.configStore.decryptKey(provider.apiKeyEncrypted)
    if (!apiKey) {
      logger.warn('No API key for provider, falling back to env vars', { feature, providerId: provider.id })
      return this.createEnvFallback()
    }

    switch (provider.adapter) {
      case 'openai-compatible':
        return new OpenAICompatibleAdapter(provider.baseUrl, apiKey, config.model)
      case 'claude':
        return new ClaudeAdapter(apiKey, config.model)
      default:
        logger.warn('Unknown adapter type, falling back to env vars', { adapter: provider.adapter })
        return this.createEnvFallback()
    }
  }

  /**
   * Returns LLM options (temperature, maxTokens) for a feature.
   */
  getOptions(feature: LlmFeature): LLMProviderOptions {
    const config = this.configStore.getFeatureConfig(feature)

    if (!config) {
      // Sensible defaults per feature type
      return this.defaultOptions(feature)
    }

    return {
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    }
  }

  // ── Private ──

  private createEnvFallback(): LLMProvider {
    if (!env.DASHSCOPE_API_KEY) {
      throw new Error('DASHSCOPE_API_KEY is not configured')
    }
    return new OpenAICompatibleAdapter(
      env.LLM_BASE_URL,
      env.DASHSCOPE_API_KEY,
      env.LLM_MODEL,
    )
  }

  private defaultOptions(feature: LlmFeature): LLMProviderOptions {
    switch (feature) {
      case 'coaching':
        return { maxTokens: 800, temperature: 0.7 }
      case 'scoring':
        return { maxTokens: 100, temperature: 0.1 }
      case 'apply_suggestions':
        return { maxTokens: 2000, temperature: 0.3 }
      case 'category_suggestions':
        return { maxTokens: 2000, temperature: 0.3 }
      case 'prompt_generation':
        return { maxTokens: 800, temperature: 0.8 }
    }
  }
}
