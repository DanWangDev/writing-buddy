import type { RubricScores } from '@writting-buddy/shared'
import type { LLMProvider } from '../llm/provider.js'
import type { IRubricScoresRepository } from '../../repositories/interfaces/rubric-scores-repository.js'
import { logger } from '../logger.js'

const SCORING_SYSTEM_PROMPT = [
  'You are an objective writing assessment engine for students aged 8-14.',
  'Score the following student writing against these 5 rubric dimensions on a scale of 1-10:',
  '',
  '1. content (1-10): Ideas, creativity, depth of thought, relevance to prompt',
  '2. organization (1-10): Structure, flow, logical sequencing, paragraphing',
  '3. vocabulary (1-10): Word choice variety, age-appropriate sophistication',
  '4. grammar (1-10): Sentence structure, subject-verb agreement, tense consistency',
  '5. spelling (1-10): Spelling accuracy, common word correctness',
  '',
  'Respond with ONLY a valid JSON object in this exact format:',
  '{"content":N,"organization":N,"vocabulary":N,"grammar":N,"spelling":N}',
  '',
  'Where N is an integer from 1 to 10.',
  'Do not include any other text, explanation, or formatting.',
].join('\n')

const MAX_SCORING_TOKENS = 100

interface ParsedScores {
  readonly content: number
  readonly organization: number
  readonly vocabulary: number
  readonly grammar: number
  readonly spelling: number
}

function parseScoresFromResponse(responseContent: string): ParsedScores {
  const jsonMatch = responseContent.match(/\{[^}]+\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in LLM response')
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>

  const dimensions = ['content', 'organization', 'vocabulary', 'grammar', 'spelling'] as const
  const scores: Record<string, number> = {}

  for (const dim of dimensions) {
    const value = parsed[dim]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10) {
      throw new Error(`Invalid score for ${dim}: ${String(value)}`)
    }
    scores[dim] = value
  }

  return scores as unknown as ParsedScores
}

function calculateOverallScore(scores: ParsedScores): number {
  const sum = scores.content + scores.organization + scores.vocabulary + scores.grammar + scores.spelling
  return Math.round(sum / 5)
}

export class RubricScorerService {
  private readonly llmProvider: LLMProvider
  private readonly rubricScoresRepo: IRubricScoresRepository

  constructor(
    llmProvider: LLMProvider,
    rubricScoresRepo: IRubricScoresRepository
  ) {
    this.llmProvider = llmProvider
    this.rubricScoresRepo = rubricScoresRepo
  }

  async scoreSubmission(
    submissionId: string,
    latestRevision: string,
    promptBody: string
  ): Promise<RubricScores> {
    const userPrompt = [
      'Writing Prompt:',
      promptBody,
      '',
      'Student Writing:',
      latestRevision,
    ].join('\n')

    let lastError: Error | undefined

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const llmResponse = await this.llmProvider.generateResponse(
          SCORING_SYSTEM_PROMPT,
          userPrompt,
          { maxTokens: MAX_SCORING_TOKENS, temperature: 0.1 }
        )

        const scores = parseScoresFromResponse(llmResponse.content)
        const overallScore = calculateOverallScore(scores)

        const rubricScores = this.rubricScoresRepo.create({
          submissionId,
          content: scores.content,
          organization: scores.organization,
          vocabulary: scores.vocabulary,
          grammar: scores.grammar,
          spelling: scores.spelling,
          overallScore,
          status: 'scored',
          llmModel: llmResponse.model,
          llmTokensUsed: llmResponse.tokensUsed,
        })

        return rubricScores
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        logger.warn('Rubric scoring attempt failed', {
          attempt: attempt + 1,
          submissionId,
          error: lastError.message,
        })
      }
    }

    logger.error('Rubric scoring failed after retries, storing scoring_failed', {
      submissionId,
      error: lastError?.message,
    })

    const failedScores = this.rubricScoresRepo.create({
      submissionId,
      content: 0,
      organization: 0,
      vocabulary: 0,
      grammar: 0,
      spelling: 0,
      overallScore: 0,
      status: 'scoring_failed',
    })

    return failedScores
  }
}
