import { env } from '../../config/env.js'
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

export class DashScopeAdapter implements LLMProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl: string

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? env.DASHSCOPE_API_KEY
    this.model = model ?? env.LLM_MODEL
    this.baseUrl = baseUrl ?? env.LLM_BASE_URL

    if (!this.apiKey) {
      throw new Error(
        'DASHSCOPE_API_KEY is not configured. Set it in your .env file.'
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }

    logger.info('LLM request', {
      model: this.model,
      maxTokens: options.maxTokens,
    })

    const url = `${this.baseUrl}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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
      throw new Error(`DashScope API error: ${message}`)
    }

    if (!responseText) {
      throw new Error('DashScope API returned empty response')
    }

    let data: OpenAIChatResponse
    try {
      data = JSON.parse(responseText) as OpenAIChatResponse
    } catch {
      logger.error('LLM API returned invalid JSON', {
        responseText: responseText.slice(0, 200),
        url,
      })
      throw new Error('DashScope API returned invalid response')
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('DashScope API returned no choices')
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
