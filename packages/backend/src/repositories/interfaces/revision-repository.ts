import type { Revision } from '@writting-buddy/shared'

export interface IRevisionRepository {
  findBySubmissionId(submissionId: string): Revision[]
  findLatest(submissionId: string): Revision | null
  create(submissionId: string, content: string): Revision
  countBySubmissionId(submissionId: string): number
}
