import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteCoachingPassRepository } from '../repositories/sqlite/coaching-pass-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteRevisionRepository } from '../repositories/sqlite/revision-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { AiCoachService } from '../services/coaching/ai-coach.js'
import { ContentSafetyService } from '../services/content-safety.js'
import type { LLMProvider, LLMResponse, LLMProviderOptions } from '../services/llm/provider.js'

class MockLLMProvider implements LLMProvider {
  public calls: Array<{ systemPrompt: string; userPrompt: string; options: LLMProviderOptions }> = []
  public response: LLMResponse = {
    content: 'Great writing! I love how you described the dragon.',
    tokensUsed: 200,
    model: 'mock-model',
  }
  public shouldThrow = false

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: LLMProviderOptions
  ): Promise<LLMResponse> {
    this.calls.push({ systemPrompt, userPrompt, options })
    if (this.shouldThrow) {
      throw new Error('LLM API unavailable')
    }
    return { ...this.response }
  }
}

describe('AiCoachService', () => {
  let db: DatabaseType
  let mockLLM: MockLLMProvider
  let aiCoach: AiCoachService
  let coachingPassRepo: SqliteCoachingPassRepository
  let submissionRepo: SqliteSubmissionRepository
  let revisionRepo: SqliteRevisionRepository
  let userId: string
  let submissionId: string

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    const userRepo = new SqliteUserRepository(db)
    const user = userRepo.create({
      email: 'coach@example.com',
      displayName: 'Test Writer',
      password: 'pass123',
      role: 'student',
      passwordHash: 'hashed',
    })
    userId = user.id

    submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(userId)
    submissionId = submission.id

    revisionRepo = new SqliteRevisionRepository(db)
    revisionRepo.create(
      submissionId,
      'The dragon flew over the mountain and breathed fire on the village. The villagers ran and screamed as the beast descended. It was the most terrifying day of their lives.'
    )

    coachingPassRepo = new SqliteCoachingPassRepository(db)
    mockLLM = new MockLLMProvider()

    aiCoach = new AiCoachService(
      mockLLM,
      coachingPassRepo,
      submissionRepo,
      revisionRepo,
      new ContentSafetyService(),
      {
        freeTierDailySessions: 3,
        dailySpendCeiling: 50,
        costPerToken: 0.000003,
      }
    )
  })

  describe('getNextPass', () => {
    it('creates the first coaching pass (acknowledgment)', async () => {
      const pass = await aiCoach.getNextPass(submissionId, userId)

      expect(pass.passType).toBe('acknowledgment')
      expect(pass.feedback).toBe('Great writing! I love how you described the dragon.')
      expect(pass.submissionId).toBe(submissionId)
      expect(pass.llmModel).toBe('mock-model')
      expect(pass.llmTokensUsed).toBe(200)
    })

    it('sequences pass types correctly', async () => {
      const pass1 = await aiCoach.getNextPass(submissionId, userId)
      expect(pass1.passType).toBe('acknowledgment')

      const pass2 = await aiCoach.getNextPass(submissionId, userId)
      expect(pass2.passType).toBe('guiding_questions')

      const pass3 = await aiCoach.getNextPass(submissionId, userId)
      // This will hit the daily limit with default config of 3
      expect(pass3.passType).toBe('suggestions')
    })

    it('cycles back to acknowledgment after 4 passes', async () => {
      // Increase the daily limit for this test
      aiCoach = new AiCoachService(
        mockLLM,
        coachingPassRepo,
        submissionRepo,
        revisionRepo,
        new ContentSafetyService(),
        { freeTierDailySessions: 10, dailySpendCeiling: 50, costPerToken: 0.000003 }
      )

      await aiCoach.getNextPass(submissionId, userId) // acknowledgment
      await aiCoach.getNextPass(submissionId, userId) // guiding_questions
      await aiCoach.getNextPass(submissionId, userId) // suggestions
      await aiCoach.getNextPass(submissionId, userId) // polish

      const pass5 = await aiCoach.getNextPass(submissionId, userId)
      expect(pass5.passType).toBe('acknowledgment')
    })

    it('enforces daily rate limit', async () => {
      aiCoach = new AiCoachService(
        mockLLM,
        coachingPassRepo,
        submissionRepo,
        revisionRepo,
        new ContentSafetyService(),
        { freeTierDailySessions: 2, dailySpendCeiling: 50, costPerToken: 0.000003 }
      )

      await aiCoach.getNextPass(submissionId, userId)
      await aiCoach.getNextPass(submissionId, userId)

      await expect(
        aiCoach.getNextPass(submissionId, userId)
      ).rejects.toThrow('Daily coaching limit reached')
    })

    it('enforces spend ceiling circuit breaker (decision 9C)', async () => {
      aiCoach = new AiCoachService(
        mockLLM,
        coachingPassRepo,
        submissionRepo,
        revisionRepo,
        new ContentSafetyService(),
        {
          freeTierDailySessions: 100,
          dailySpendCeiling: 0.0001,
          costPerToken: 1,
        }
      )

      // First pass uses 200 tokens at $1/token = $200 > $0.0001
      await aiCoach.getNextPass(submissionId, userId)

      await expect(
        aiCoach.getNextPass(submissionId, userId)
      ).rejects.toThrow('temporarily unavailable')
    })

    it('rejects if submission not found', async () => {
      await expect(
        aiCoach.getNextPass('nonexistent', userId)
      ).rejects.toThrow('Submission not found')
    })

    it('rejects if user does not own submission', async () => {
      await expect(
        aiCoach.getNextPass(submissionId, 'other-user')
      ).rejects.toThrow('Access denied')
    })

    it('uses fallback feedback when LLM fails', async () => {
      mockLLM.shouldThrow = true

      const pass = await aiCoach.getNextPass(submissionId, userId)

      expect(pass.feedback).toContain('Great work on your writing')
      expect(pass.llmModel).toBeUndefined()
    })

    it('updates submission status to in_coaching', async () => {
      await aiCoach.getNextPass(submissionId, userId)

      const updated = submissionRepo.findById(submissionId)
      expect(updated?.status).toBe('in_coaching')
    })

    it('rejects completed submissions', async () => {
      submissionRepo.complete(submissionId, 10)

      await expect(
        aiCoach.getNextPass(submissionId, userId)
      ).rejects.toThrow('already completed')
    })

    it('sends system and user prompts to LLM', async () => {
      await aiCoach.getNextPass(submissionId, userId)

      expect(mockLLM.calls).toHaveLength(1)
      expect(mockLLM.calls[0].systemPrompt).toContain('writing coach')
      expect(mockLLM.calls[0].userPrompt).toContain('dragon flew over')
    })
  })
})
