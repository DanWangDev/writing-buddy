import type { Revision } from '@writing-buddy/shared'

export interface IRevisionRepository {
  findBySubmissionId(submissionId: string): Revision[]
  findLatest(submissionId: string): Revision | null
  create(submissionId: string, content: string): Revision
  countBySubmissionId(submissionId: string): number
}
