import type { CoachingPass } from '@writing-buddy/shared'

export interface CreateCoachingPassDto {
  readonly submissionId: string
  readonly revisionNumber: number
  readonly passType: string
  readonly feedback: string
  readonly focusDimension?: string
  readonly llmModel?: string
  readonly llmTokensUsed?: number
}

export interface ICoachingPassRepository {
  findBySubmissionId(submissionId: string): CoachingPass[]
  create(data: CreateCoachingPassDto): CoachingPass
  countTodayByUserId(userId: string): number
  sumTodayTokens(): number
}
