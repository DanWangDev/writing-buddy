export interface LLMProviderOptions {
  readonly maxTokens: number
  readonly temperature?: number
}

export interface LLMResponse {
  readonly content: string
  readonly tokensUsed: number
  readonly model: string
}

export interface LLMProvider {
  generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: LLMProviderOptions
  ): Promise<LLMResponse>
}
