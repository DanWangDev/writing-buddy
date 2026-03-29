export type PromptGenre =
  | 'adventure'
  | 'mystery'
  | 'sci-fi'
  | 'fantasy'
  | 'humor'
  | 'descriptive'
  | 'persuasive'

export type PromptDifficulty = 'beginner' | 'standard' | 'challenge'

export interface Prompt {
  id: string
  title: string
  body: string
  genre: PromptGenre
  difficulty: PromptDifficulty
  wordCountTarget?: number
  timeLimitMinutes?: number
  tags: string[]
  createdAt: string
  updatedAt?: string
  archivedAt?: string
}

export type CreatePromptDto = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>

export type UpdatePromptDto = Partial<CreatePromptDto>
