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
}
