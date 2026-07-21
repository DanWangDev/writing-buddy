import { z } from 'zod'
import type { LLMProvider, LLMProviderOptions } from './llm/provider.js'
import type { PromptGenre, PromptDifficulty } from '@writing-buddy/shared'
import { logger } from './logger.js'

// ── Zod schemas for validating LLM JSON output ──

const generatedPromptSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(20).max(2000),
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
  wordCountTarget: z.number().int().min(50).max(1000).optional(),
})

const refinedBodySchema = z.object({
  body: z.string().min(20).max(2000),
})

const refinedTitleSchema = z.object({
  title: z.string().min(3).max(200),
})

const suggestedTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).min(1).max(10),
})

// ── Type exports ──

export type GenerateMode = 'full' | 'refine_body' | 'refine_title' | 'suggest_tags'

export interface GenerateRequest {
  mode: GenerateMode
  genre: PromptGenre
  difficulty: PromptDifficulty
  seed?: string
  current?: string
}

export interface GenerateResult {
  title?: string
  body?: string
  tags?: string[]
  wordCountTarget?: number
  tokensUsed: number
  model: string
}

// ── 11+ criteria and genre coaching notes (shared with coaching engine) ──

const ELEVEN_PLUS_CRITERIA = [
  'sensory details across all five senses (not just sight)',
  "show-don't-tell techniques (showing emotions through actions and body language)",
  'varied sentence starters (avoid beginning every sentence with "I" or "The")',
  'ambitious vocabulary (replacing common words like "nice", "said", "went" with powerful alternatives)',
  'clear story structure with a compelling opening, rising tension, climax, and satisfying resolution',
  'effective use of dialogue with varied speech verbs',
  'figurative language (similes, metaphors, personification)',
].join(', ')

const GENRE_COACHING: Record<string, string> = {
  adventure:
    'For adventure writing, focus on pacing, tension-building, and action verbs that keep the reader on the edge of their seat.',
  mystery:
    'For mystery writing, focus on planting clues, building suspense, and creating an atmosphere of intrigue without giving the ending away.',
  'sci-fi':
    'For sci-fi writing, focus on world-building details that feel believable and sensory descriptions of unfamiliar settings.',
  fantasy:
    'For fantasy writing, focus on vivid world-building, magical elements that feel real, and sensory details that bring the fantasy world to life.',
  humor:
    'For humorous writing, focus on timing, unexpected twists, and playful word choices that make the reader smile.',
  descriptive:
    "For descriptive writing, focus on rich sensory imagery across all five senses, precise word choices, and creating a vivid picture in the reader's mind.",
  persuasive:
    'For persuasive writing, focus on strong topic sentences, convincing evidence, rhetorical questions, and a powerful conclusion.',
}

const DIFFICULTY_GUIDANCE: Record<string, { wordTarget: number; description: string }> = {
  beginner: {
    wordTarget: 200,
    description:
      'Simple, relatable scenarios. Clear task with one main focus. Accessible vocabulary. Suitable for a student building confidence.',
  },
  standard: {
    wordTarget: 300,
    description:
      'More complex scenarios requiring some development. May include a twist or moral dimension. Expectation of structured paragraphs.',
  },
  challenge: {
    wordTarget: 400,
    description:
      'Ambitious, thought-provoking scenarios. May involve abstract concepts, moral dilemmas, or multi-layered tasks. Expectation of sophisticated structure and vocabulary.',
  },
}

// ── System prompt builders ──

function buildFullGenerationPrompt(
  genre: PromptGenre,
  difficulty: PromptDifficulty,
  seed?: string,
): string {
  const genreNote = GENRE_COACHING[genre] ?? ''
  const diffInfo = DIFFICULTY_GUIDANCE[difficulty]
  const seedInstruction = seed
    ? `\nThe admin provided this seed idea: "${seed}". Use this as inspiration and expand it into a full prompt.\n`
    : ''

  return [
    'You are creating writing prompts for students aged 10-11 preparing for UK 11+ creative writing exams.',
    '',
    'EXAM CRITERIA: ' + ELEVEN_PLUS_CRITERIA + '.',
    '',
    'Genre: ' + genre,
    'Difficulty: ' + difficulty + ' (' + diffInfo.description + ')',
    '',
    genreNote,
    seedInstruction,
    'Instructions:',
    '- Create an exciting, manga-inspired writing prompt that feels like a creative adventure, not homework',
    '- Title: Catchy, bold, 5-10 words — something that grabs attention like a comic book title',
    '- Body: 2-4 sentences. Set up a SPECIFIC, vivid scenario then give a clear writing task. Be concrete — not "write about bravery" but "You discover a hidden door in your school library with your name carved into it..."',
    '- Use sensory hooks: mention sounds, smells, textures, or visual details the student can imagine',
    '- Tags: 3-6 relevant keywords that describe the prompt (e.g., "magic", "mystery", "animals")',
    '- Word count target: ' + diffInfo.wordTarget + ' words',
    '- Make it specific and immersive — the best prompts drop the student straight into a moment',
    '- Age-appropriate: exciting but not scary, challenging but not frustrating',
    '',
    'Output as valid JSON only (no markdown, no explanation):',
    '{"title": "...", "body": "...", "tags": ["...", "..."], "wordCountTarget": ' + diffInfo.wordTarget + '}',
  ].join('\n')
}

function buildRefineBodyPrompt(
  genre: PromptGenre,
  difficulty: PromptDifficulty,
  current: string,
): string {
  const genreNote = GENRE_COACHING[genre] ?? ''
  const diffInfo = DIFFICULTY_GUIDANCE[difficulty]

  return [
    'You are polishing a writing prompt body for a 10-11 year old student preparing for UK 11+ creative writing exams.',
    '',
    'Current text: "' + current + '"',
    'Genre: ' + genre + ' | Difficulty: ' + difficulty + ' (' + diffInfo.description + ')',
    '',
    genreNote,
    '',
    'Improve it:',
    '- Make it more vivid and specific — add concrete sensory details',
    '- Add sensory hooks ("the smell of...", "you hear...", "the ground felt...")',
    '- Drop the student straight into a moment rather than describing from outside',
    '- Keep the student voice — don\'t make it sound like a textbook',
    '- Stay under 2000 characters',
    '- Preserve the original scenario and intent — just make it better',
    '- If it already has a clear scenario, focus on sharpening the language and adding one vivid detail',
    '',
    'Output as valid JSON only (no markdown, no explanation):',
    '{"body": "..."}',
  ].join('\n')
}

function buildRefineTitlePrompt(
  _genre: PromptGenre,
  _difficulty: PromptDifficulty,
  current: string,
): string {
  return [
    'You are polishing a writing prompt title for a 10-11 year old student.',
    '',
    'Current title: "' + current + '"',
    '',
    'Improve it:',
    '- Make it catchy and bold — like a comic book or manga chapter title',
    '- 5-10 words maximum',
    '- Use exciting, active language',
    '- Preserve the core idea — just make it pop more',
    '- Examples of great titles: "The Door That Shouldn\'t Exist", "When the Library Came Alive", "The Day Gravity Switched Off"',
    '',
    'Output as valid JSON only (no markdown, no explanation):',
    '{"title": "..."}',
  ].join('\n')
}

function buildSuggestTagsPrompt(
  genre: PromptGenre,
  _difficulty: PromptDifficulty,
  body: string,
): string {
  return [
    'You are tagging a writing prompt for a 10-11 year old student.',
    '',
    'Genre: ' + genre,
    'Prompt body: "' + body + '"',
    '',
    'Suggest 3-6 relevant tags as keywords. Tags should:',
    '- Describe the theme, setting, or mood (e.g., "magic", "space", "friendship", "spooky")',
    '- Be single words or short 2-word phrases',
    '- Help students find this prompt when browsing',
    '- Be lowercase',
    '',
    'Output as valid JSON only (no markdown, no explanation):',
    '{"tags": ["tag1", "tag2", "tag3"]}',
  ].join('\n')
}

// ── JSON extraction helper ──

function extractJson(text: string): string {
  // Try to find JSON object in the text (handles LLMs that wrap in markdown or add commentary)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  throw new Error('No JSON object found in LLM response')
}

// ── Main service ──

export class PromptGeneratorService {
  constructor(private readonly llm: LLMProvider) {}

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    logger.info('Generating prompt', { mode: request.mode, genre: request.genre, difficulty: request.difficulty })

    switch (request.mode) {
      case 'full':
        return this.generateFull(request)
      case 'refine_body':
        return this.refineBody(request)
      case 'refine_title':
        return this.refineTitle(request)
      case 'suggest_tags':
        return this.suggestTags(request)
    }
  }

  private async generateFull(request: GenerateRequest): Promise<GenerateResult> {
    const systemPrompt = buildFullGenerationPrompt(request.genre, request.difficulty, request.seed)
    const userPrompt = 'Generate a complete writing prompt based on the instructions above.'

    const result = await this.callLLM(systemPrompt, userPrompt, 0.8)

    const parsed = this.parseAndValidate(result.content, generatedPromptSchema)

    return {
      title: parsed.title,
      body: parsed.body,
      tags: parsed.tags,
      wordCountTarget: parsed.wordCountTarget ?? DIFFICULTY_GUIDANCE[request.difficulty].wordTarget,
      tokensUsed: result.tokensUsed,
      model: result.model,
    }
  }

  private async refineBody(request: GenerateRequest): Promise<GenerateResult> {
    if (!request.current) {
      throw new Error('current text is required for refine_body mode')
    }

    const systemPrompt = buildRefineBodyPrompt(request.genre, request.difficulty, request.current)
    const userPrompt = 'Refine the prompt body as instructed above.'

    const result = await this.callLLM(systemPrompt, userPrompt, 0.5)

    const parsed = this.parseAndValidate(result.content, refinedBodySchema)

    return {
      body: parsed.body,
      tokensUsed: result.tokensUsed,
      model: result.model,
    }
  }

  private async refineTitle(request: GenerateRequest): Promise<GenerateResult> {
    if (!request.current) {
      throw new Error('current text is required for refine_title mode')
    }

    const systemPrompt = buildRefineTitlePrompt(request.genre, request.difficulty, request.current)
    const userPrompt = 'Refine the title as instructed above.'

    const result = await this.callLLM(systemPrompt, userPrompt, 0.5)

    const parsed = this.parseAndValidate(result.content, refinedTitleSchema)

    return {
      title: parsed.title,
      tokensUsed: result.tokensUsed,
      model: result.model,
    }
  }

  private async suggestTags(request: GenerateRequest): Promise<GenerateResult> {
    if (!request.current) {
      throw new Error('current text is required for suggest_tags mode')
    }

    const systemPrompt = buildSuggestTagsPrompt(request.genre, request.difficulty, request.current)
    const userPrompt = 'Suggest tags as instructed above.'

    const result = await this.callLLM(systemPrompt, userPrompt, 0.5)

    const parsed = this.parseAndValidate(result.content, suggestedTagsSchema)

    return {
      tags: parsed.tags,
      tokensUsed: result.tokensUsed,
      model: result.model,
    }
  }

  // ── LLM call with retry on JSON parse failure ──

  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
  ): Promise<{ content: string; tokensUsed: number; model: string }> {
    try {
      const response = await this.llm.generateResponse(systemPrompt, userPrompt, {
        maxTokens: 800,
        temperature,
      })
      return response
    } catch (error) {
      logger.error('LLM call failed in prompt generator', { error: String(error) })
      throw new Error('AI generation failed. Please try again.')
    }
  }

  private parseAndValidate<T>(content: string, schema: z.ZodSchema<T>): T {
    // First attempt: direct parse
    try {
      const json = extractJson(content)
      return schema.parse(JSON.parse(json))
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('LLM output failed validation', {
          issues: error.issues.map((i) => i.message).join(', '),
          content: content.slice(0, 200),
        })
        throw new Error('AI generated content did not meet requirements. Please try again.')
      }
      // JSON parse error
      logger.warn('Failed to parse LLM JSON output', {
        content: content.slice(0, 200),
      })
      throw new Error('AI response could not be parsed. Please try again.')
    }
  }
}
