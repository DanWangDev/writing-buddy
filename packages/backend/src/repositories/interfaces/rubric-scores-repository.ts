import type { RubricScores } from '@writing-buddy/shared'

export interface CreateRubricScoresDto {
  readonly submissionId: string
  readonly content: number
  readonly organization: number
  readonly vocabulary: number
  readonly grammar: number
  readonly spelling: number
  readonly overallScore: number
  readonly status: 'scored' | 'scoring_failed'
  readonly llmModel?: string
  readonly llmTokensUsed?: number
}

export interface IRubricScoresRepository {
  findBySubmissionId(submissionId: string): RubricScores | null
  create(data: CreateRubricScoresDto): RubricScores
}
