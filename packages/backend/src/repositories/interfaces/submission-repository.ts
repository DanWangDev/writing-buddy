import type { Submission, SubmissionStatus } from '@writing-buddy/shared'

export interface SubmissionFilters {
  readonly status?: SubmissionStatus
}

export interface ISubmissionRepository {
  findById(id: string): Submission | null
  findByUserId(userId: string, filters?: SubmissionFilters): Submission[]
  create(userId: string, promptId?: string): Submission
  updateStatus(id: string, status: SubmissionStatus): Submission | null
  updateWordCount(id: string, wordCount: number): Submission | null
  complete(id: string, xpEarned: number): Submission | null
  delete(id: string): boolean
}
