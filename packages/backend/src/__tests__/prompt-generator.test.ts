import { describe, it, expect, beforeEach } from 'vitest'
import { PromptGeneratorService } from '../services/prompt-generator.js'
import type { LLMProvider, LLMResponse } from '../services/llm/provider.js'
import type { GenerateRequest } from '../services/prompt-generator.js'

// ── Mock LLM provider that returns controlled responses ──

function createMockLLM(jsonResponse: Record<string, unknown>): LLMProvider {
  return {
    async generateResponse(): Promise<LLMResponse> {
      return {
        content: JSON.stringify(jsonResponse),
        tokensUsed: 42,
        model: 'mock-model',
      }
    },
  }
}

function createFailingLLM(): LLMProvider {
  return {
    async generateResponse(): Promise<LLMResponse> {
      throw new Error('API unavailable')
    },
  }
}

function createBadJsonLLM(): LLMProvider {
  return {
    async generateResponse(): Promise<LLMResponse> {
      return {
        content: 'Sure, here is your prompt: ...not json...',
        tokensUsed: 10,
        model: 'mock-model',
      }
    },
  }
}

function createInvalidSchemaLLM(): LLMProvider {
  return {
    async generateResponse(): Promise<LLMResponse> {
      return {
        content: JSON.stringify({ title: 'ab', body: 'too short', tags: [] }),
        tokensUsed: 10,
        model: 'mock-model',
      }
    },
  }
}

// ── Helpers ──

function baseRequest(overrides?: Partial<GenerateRequest>): GenerateRequest {
  return {
    mode: 'full',
    genre: 'adventure',
    difficulty: 'standard',
    ...overrides,
  }
}

// ── Tests ──

describe('PromptGeneratorService', () => {
  describe('full generation', () => {
    it('generates a complete prompt with all fields', async () => {
      const mock = createMockLLM({
        title: 'The Hidden Compass of Doom',
        body: 'You find an ancient compass in your grandfather\'s attic. When you touch it, the needle spins and points to a door that wasn\'t there before. Write a story about what happens next.',
        tags: ['adventure', 'mystery', 'magic', 'discovery'],
        wordCountTarget: 300,
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest())

      expect(result.title).toBe('The Hidden Compass of Doom')
      expect(result.body).toContain('ancient compass')
      expect(result.tags).toEqual(['adventure', 'mystery', 'magic', 'discovery'])
      expect(result.wordCountTarget).toBe(300)
      expect(result.tokensUsed).toBe(42)
      expect(result.model).toBe('mock-model')
    })

    it('passes seed to the LLM when provided', async () => {
      let capturedSystemPrompt = ''
      const mock: LLMProvider = {
        async generateResponse(systemPrompt: string): Promise<LLMResponse> {
          capturedSystemPrompt = systemPrompt
          return {
            content: JSON.stringify({
              title: 'Test',
              body: 'A test prompt body with enough characters to pass.',
              tags: ['test'],
              wordCountTarget: 200,
            }),
            tokensUsed: 10,
            model: 'mock',
          }
        },
      }
      const service = new PromptGeneratorService(mock)

      await service.generate(baseRequest({ seed: 'a haunted treehouse' }))

      expect(capturedSystemPrompt).toContain('haunted treehouse')
    })

    it('returns wordCountTarget from difficulty when LLM omits it', async () => {
      const mock = createMockLLM({
        title: 'Test Title Here',
        body: 'A test prompt body with enough characters to pass validation.',
        tags: ['test'],
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest({ difficulty: 'beginner' }))

      expect(result.wordCountTarget).toBe(200)
    })

    it('returns wordCountTarget from difficulty for challenge', async () => {
      const mock = createMockLLM({
        title: 'Test Title Here',
        body: 'A test prompt body with enough characters to pass validation.',
        tags: ['test'],
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest({ difficulty: 'challenge' }))

      expect(result.wordCountTarget).toBe(400)
    })
  })

  describe('refine_body', () => {
    it('returns a refined body', async () => {
      const mock = createMockLLM({
        body: 'You discover a shimmering portal hidden behind the waterfall near your school. Step through and describe the world you find on the other side.',
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest({
        mode: 'refine_body',
        current: 'Write about finding a portal.',
      }))

      expect(result.body).toContain('shimmering portal')
      expect(result.tokensUsed).toBe(42)
    })

    it('throws when current text is missing', async () => {
      const mock = createMockLLM({ body: 'refined' })
      const service = new PromptGeneratorService(mock)

      await expect(
        service.generate(baseRequest({ mode: 'refine_body' })),
      ).rejects.toThrow('current text is required')
    })
  })

  describe('refine_title', () => {
    it('returns a refined title', async () => {
      const mock = createMockLLM({
        title: 'The Door That Shouldn\'t Exist',
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest({
        mode: 'refine_title',
        current: 'A weird door',
      }))

      expect(result.title).toBe('The Door That Shouldn\'t Exist')
    })

    it('throws when current text is missing', async () => {
      const mock = createMockLLM({ title: 'refined' })
      const service = new PromptGeneratorService(mock)

      await expect(
        service.generate(baseRequest({ mode: 'refine_title' })),
      ).rejects.toThrow('current text is required')
    })
  })

  describe('suggest_tags', () => {
    it('returns suggested tags', async () => {
      const mock = createMockLLM({
        tags: ['magic', 'school', 'mystery', 'adventure'],
      })
      const service = new PromptGeneratorService(mock)

      const result = await service.generate(baseRequest({
        mode: 'suggest_tags',
        current: 'You find a spellbook in the lost-and-found box at school.',
      }))

      expect(result.tags).toHaveLength(4)
      expect(result.tags).toContain('magic')
    })

    it('throws when current text is missing', async () => {
      const mock = createMockLLM({ tags: ['test'] })
      const service = new PromptGeneratorService(mock)

      await expect(
        service.generate(baseRequest({ mode: 'suggest_tags' })),
      ).rejects.toThrow('current text is required')
    })
  })

  describe('error handling', () => {
    it('throws when LLM call fails', async () => {
      const service = new PromptGeneratorService(createFailingLLM())

      await expect(
        service.generate(baseRequest()),
      ).rejects.toThrow('AI generation failed')
    })

    it('throws when LLM returns non-JSON content', async () => {
      const service = new PromptGeneratorService(createBadJsonLLM())

      await expect(
        service.generate(baseRequest()),
      ).rejects.toThrow('AI response could not be parsed')
    })

    it('throws when LLM JSON fails schema validation', async () => {
      const service = new PromptGeneratorService(createInvalidSchemaLLM())

      await expect(
        service.generate(baseRequest()),
      ).rejects.toThrow('AI generated content did not meet requirements')
    })
  })

  describe('all genres and difficulties', () => {
    const genres = ['adventure', 'mystery', 'sci-fi', 'fantasy', 'humor', 'descriptive', 'persuasive'] as const
    const difficulties = ['beginner', 'standard', 'challenge'] as const

    for (const genre of genres) {
      for (const difficulty of difficulties) {
        it(`generates for ${genre} / ${difficulty}`, async () => {
          const mock = createMockLLM({
            title: `${genre} ${difficulty} Prompt`,
            body: 'A test prompt body with enough characters to pass validation checks.',
            tags: [genre, difficulty],
            wordCountTarget: difficulty === 'beginner' ? 200 : difficulty === 'standard' ? 300 : 400,
          })
          const service = new PromptGeneratorService(mock)

          const result = await service.generate(baseRequest({ genre, difficulty }))

          expect(result.title).toBeDefined()
          expect(result.body).toBeDefined()
          expect(result.tags.length).toBeGreaterThan(0)
        })
      }
    }
  })
})
