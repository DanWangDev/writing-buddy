import type { Prompt, PromptGenre, PromptDifficulty, UpdatePromptDto } from '@writing-buddy/shared'

export interface PromptFilters {
  readonly genre?: PromptGenre
  readonly difficulty?: PromptDifficulty
}

export interface IPromptRepository {
  findAll(filters?: PromptFilters): Prompt[]
  findById(id: string): Prompt | null
  create(prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>): Prompt
  update(id: string, data: UpdatePromptDto): Prompt | null
  delete(id: string): boolean
  count(filters?: PromptFilters): number
}
