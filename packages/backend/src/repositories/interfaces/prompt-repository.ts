import type { Prompt, PromptGenre, PromptDifficulty } from '@writing-buddy/shared'

export interface PromptFilters {
  readonly genre?: PromptGenre
  readonly difficulty?: PromptDifficulty
}

export interface IPromptRepository {
  findAll(filters?: PromptFilters): Prompt[]
  findById(id: string): Prompt | null
  create(prompt: Omit<Prompt, 'id' | 'createdAt'>): Prompt
  count(filters?: PromptFilters): number
}
