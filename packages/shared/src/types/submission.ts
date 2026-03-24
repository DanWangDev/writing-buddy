export type SubmissionStatus = 'draft' | 'in_coaching' | 'completed'

export interface Submission {
  id: string
  userId: string
  promptId?: string
  promptTitle?: string
  currentRevision: number
  status: SubmissionStatus
  wordCount: number
  startedAt: string
  completedAt?: string
  xpEarned: number
}

export interface Revision {
  id: string
  submissionId: string
  revisionNumber: number
  content: string
  wordCount: number
  createdAt: string
}
