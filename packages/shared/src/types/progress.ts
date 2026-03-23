export type RubricDimension =
  | 'content'
  | 'organization'
  | 'vocabulary'
  | 'grammar'
  | 'spelling'

export interface RubricScores {
  id: string
  submissionId: string
  content: number
  organization: number
  vocabulary: number
  grammar: number
  spelling: number
  overallScore: number
  status: 'scored' | 'scoring_failed'
  llmModel?: string
  llmTokensUsed?: number
  createdAt: string
}

export interface WritingProgress {
  id: string
  userId: string
  date: string
  submissionsCount: number
  revisionsCount: number
  wordsWritten: number
  coachingSessions: number
  xpEarned: number
  streakDays: number
}
