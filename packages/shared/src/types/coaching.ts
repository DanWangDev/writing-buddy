export type PassType =
  | 'acknowledgment'
  | 'guiding_questions'
  | 'suggestions'
  | 'polish'

export type FocusDimension =
  | 'sensory_detail'
  | 'character'
  | 'structure'
  | 'vocabulary'
  | 'grammar'

export interface CoachingPass {
  id: string
  submissionId: string
  revisionNumber: number
  passType: PassType
  feedback: string
  focusDimension?: FocusDimension
  llmModel?: string
  llmTokensUsed?: number
  createdAt: string
}

export interface CoachingSession {
  submissionId: string
  currentPass: number
  passes: CoachingPass[]
  isComplete: boolean
}
