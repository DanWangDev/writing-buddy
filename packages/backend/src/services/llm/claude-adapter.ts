import { env } from '../../config/env.js'
import { logger } from '../logger.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from './provider.js'

interface AnthropicMessageResponse {
  readonly id: string
  readonly type: string
  readonly role: string
  readonly content: ReadonlyArray<{ readonly type: string; readonly text: string }>
  readonly model: string
  readonly usage: {
    readonly input_tokens: number
    readonly output_tokens: number
  }
}

interface AnthropicErrorResponse {
  readonly error: {
    readonly type: string
    readonly message: string
  }
}

export class ClaudeAdapter implements LLMProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey ?? env.ANTHROPIC_API_KEY
    this.model = model ?? env.LLM_MODEL
    this.baseUrl = 'https://api.anthropic.com/v1/messages'

    if (!this.apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Set it in your .env file.'
      )
    }
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: LLMProviderOptions
  ): Promise<LLMResponse> {
    const body = {
      model: this.model,
      max_tokens: options.maxTokens,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }

    logger.info('LLM request', {
      model: this.model,
      maxTokens: options.maxTokens,
    })

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = (await response.json()) as AnthropicErrorResponse
      const message = errorBody?.error?.message ?? `HTTP ${response.status}`
      logger.error('LLM API error', {
        status: response.status,
        message,
      })
      throw new Error(`Anthropic API error: ${message}`)
    }

    const data = (await response.json()) as AnthropicMessageResponse
    const content = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const tokensUsed = data.usage.input_tokens + data.usage.output_tokens

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
