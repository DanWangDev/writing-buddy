import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DashScopeAdapter } from '../services/llm/dashscope-adapter.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('../config/env.js', () => ({
  env: {
    DASHSCOPE_API_KEY: 'test-api-key',
    LLM_BASE_URL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    LLM_MODEL: 'qwen-plus',
  },
}))

function createSuccessResponse(content: string, model = 'qwen-plus') {
  return {
    ok: true,
    json: async () => ({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    }),
  }
}

function createErrorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    json: async () => ({
      error: {
        message,
        type: 'invalid_request_error',
        code: 'invalid_api_key',
      },
    }),
  }
}

describe('DashScopeAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws if API key is not configured', () => {
    expect(() => new DashScopeAdapter('', 'qwen-plus')).toThrow(
      'DASHSCOPE_API_KEY is not configured'
    )
  })

  it('sends correct request format', async () => {
    mockFetch.mockResolvedValueOnce(createSuccessResponse('Hello!'))

    const adapter = new DashScopeAdapter('test-key', 'qwen-plus', 'https://test.example.com/v1')
    await adapter.generateResponse('You are helpful.', 'Hi', {
      maxTokens: 500,
      temperature: 0.7,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.example.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json',
        },
      })
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      model: 'qwen-plus',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ],
    })
  })

  it('returns content and token usage', async () => {
    mockFetch.mockResolvedValueOnce(
      createSuccessResponse('Great writing!', 'qwen-plus')
    )

    const adapter = new DashScopeAdapter('test-key', 'qwen-plus', 'https://test.example.com/v1')
    const result = await adapter.generateResponse('System prompt', 'User prompt', {
      maxTokens: 1000,
    })

    expect(result.content).toBe('Great writing!')
    expect(result.tokensUsed).toBe(150)
    expect(result.model).toBe('qwen-plus')
  })

  it('omits temperature when not provided', async () => {
    mockFetch.mockResolvedValueOnce(createSuccessResponse('Response'))

    const adapter = new DashScopeAdapter('test-key', 'qwen-plus', 'https://test.example.com/v1')
    await adapter.generateResponse('System', 'User', { maxTokens: 500 })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.temperature).toBeUndefined()
  })

  it('throws on API error with message', async () => {
    mockFetch.mockResolvedValueOnce(
      createErrorResponse(401, 'Invalid API key')
    )

    const adapter = new DashScopeAdapter('bad-key', 'qwen-plus', 'https://test.example.com/v1')
    await expect(
      adapter.generateResponse('System', 'User', { maxTokens: 500 })
    ).rejects.toThrow('DashScope API error: Invalid API key')
  })

  it('handles empty choices gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        model: 'qwen-plus',
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
      }),
    })

    const adapter = new DashScopeAdapter('test-key', 'qwen-plus', 'https://test.example.com/v1')
    const result = await adapter.generateResponse('System', 'User', {
      maxTokens: 500,
    })

    expect(result.content).toBe('')
    expect(result.tokensUsed).toBe(10)
  })

  it('uses default env values when no constructor args', async () => {
    mockFetch.mockResolvedValueOnce(createSuccessResponse('Response'))

    const adapter = new DashScopeAdapter()
    await adapter.generateResponse('System', 'User', { maxTokens: 500 })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
      expect.anything()
    )
  })
})
