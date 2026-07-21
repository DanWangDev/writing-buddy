import { env } from '../../config/env.js'
import { OpenAICompatibleAdapter } from './openai-compatible-adapter.js'
import type { LLMProvider } from './provider.js'

/**
 * Backward-compatible adapter for DashScope (Alibaba Cloud Model Studio).
 * Delegates to OpenAICompatibleAdapter — same API format.
 *
 * @deprecated Use {@link OpenAICompatibleAdapter} directly with LLM configuration from the database.
 *            This adapter exists for backward compatibility during migration.
 */
export function createDashScopeAdapter(
  apiKey?: string,
  model?: string,
  baseUrl?: string,
): LLMProvider {
  const key = apiKey ?? env.DASHSCOPE_API_KEY
  const selectedModel = model ?? env.LLM_MODEL
  const url = baseUrl ?? env.LLM_BASE_URL

  if (!key) {
    throw new Error(
      'DASHSCOPE_API_KEY is not configured. Set it in your .env file or via the LLM Configuration admin page.',
    )
  }

  return new OpenAICompatibleAdapter(url, key, selectedModel)
}

/**
 * Class-based export for direct instantiation (backward compat).
 *
 * @deprecated Use {@link OpenAICompatibleAdapter} directly.
 */
export class DashScopeAdapter {
  private readonly delegate: LLMProvider

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.delegate = createDashScopeAdapter(apiKey, model, baseUrl)
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: { readonly maxTokens: number; readonly temperature?: number },
  ) {
    return this.delegate.generateResponse(systemPrompt, userPrompt, options)
  }
}
