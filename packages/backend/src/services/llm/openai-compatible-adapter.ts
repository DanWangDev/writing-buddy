import { logger } from '../logger.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from './provider.js'

interface OpenAIChatResponse {
  readonly id: string
  readonly object: string
  readonly model: string
  readonly choices: ReadonlyArray<{
    readonly index: number
    readonly message: { readonly role: string; readonly content: string }
    readonly finish_reason: string
  }>
  readonly usage: {
    readonly prompt_tokens: number
    readonly completion_tokens: number
    readonly total_tokens: number
  }
}

interface OpenAIErrorResponse {
  readonly error: {
    readonly message: string
    readonly type: string
    readonly code: string
  }
}

/**
 * Generic adapter for any OpenAI-compatible API endpoint.
 * Works with DashScope, DeepSeek, Kimi, GLM, Mimo, and self-hosted models.
 */
export class OpenAICompatibleAdapter implements LLMProvider {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly model: string

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.model = model

    if (!this.apiKey) {
      throw new Error(
        'API key is not configured. Set it via the LLM Configuration admin page.'
      )
    }
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: LLMProviderOptions,
  ): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options.maxTokens,
      enable_thinking: false,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }

    const url = `${this.baseUrl}/chat/completions`
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = attempt * 1000
        logger.info('LLM retry', { attempt, delay, model: this.model })
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      logger.info('LLM request', {
        model: this.model,
        maxTokens: options.maxTokens,
        attempt,
      })

      try {
        const result = await this.doRequest(url, body)
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const isRetryable =
          lastError.message.includes('500') ||
          lastError.message.includes('502') ||
          lastError.message.includes('503') ||
          lastError.message.includes('system error')
        if (!isRetryable || attempt === maxRetries) {
          throw lastError
        }
      }
    }

    throw lastError ?? new Error('API request failed')
  }

  private async doRequest(
    url: string,
    body: Record<string, unknown>,
  ): Promise<LLMResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const errorBody = JSON.parse(responseText) as OpenAIErrorResponse
        message = errorBody?.error?.message ?? message
      } catch {
        message = responseText || message
      }
      logger.error('LLM API error', {
        status: response.status,
        message,
        url,
      })
      throw new Error(`API error (${response.status}): ${message}`)
    }

    if (!responseText) {
      throw new Error('API returned empty response')
    }

    let data: OpenAIChatResponse
    try {
      data = JSON.parse(responseText) as OpenAIChatResponse
    } catch {
      logger.error('LLM API returned invalid JSON', {
        responseText: responseText.slice(0, 200),
        url,
      })
      throw new Error('API returned invalid response')
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API returned no choices')
    }

    const content = data.choices[0]?.message?.content ?? ''
    const tokensUsed = data.usage?.total_tokens ?? 0

    logger.info('LLM response received', {
      model: data.model,
      tokensUsed,
    })

    return {
      content,
      tokensUsed,
      model: data.model,
    }
  }
}
