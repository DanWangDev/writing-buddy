import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { Migrator } from '../config/migrator.js'
import { migrations } from '../migrations/index.js'
import { SqliteRubricScoresRepository } from '../repositories/sqlite/rubric-scores-repository.js'
import { SqliteSubmissionRepository } from '../repositories/sqlite/submission-repository.js'
import { SqliteUserRepository } from '../repositories/sqlite/user-repository.js'
import { RubricScorerService } from '../services/scoring/rubric-scorer.js'
import type { LLMProvider, LLMProviderOptions, LLMResponse } from '../services/llm/provider.js'

class MockLLMProvider implements LLMProvider {
  public calls: Array<{ systemPrompt: string; userPrompt: string; options: LLMProviderOptions }> = []
  public response: LLMResponse = {
    content: '{"content":8,"organization":7,"vocabulary":6,"grammar":9,"spelling":8}',
    tokensUsed: 50,
    model: 'mock-scorer',
  }
  public shouldThrow = false
  public callCount = 0

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: LLMProviderOptions
  ): Promise<LLMResponse> {
    this.calls.push({ systemPrompt, userPrompt, options })
    this.callCount += 1
    if (this.shouldThrow) {
      throw new Error('LLM API unavailable')
    }
    return { ...this.response }
  }
}

describe('RubricScorerService', () => {
  let db: DatabaseType
  let mockLLM: MockLLMProvider
  let scorer: RubricScorerService
  let rubricScoresRepo: SqliteRubricScoresRepository
  let submissionId: string

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    const migrator = new Migrator(db, migrations)
    migrator.migrate()

    const userRepo = new SqliteUserRepository(db)
    const user = userRepo.create({
      email: 'scorer@example.com',
      displayName: 'Scorer',
      password: 'pass123',
      role: 'student',
      passwordHash: 'hashed',
    })

    const submissionRepo = new SqliteSubmissionRepository(db)
    const submission = submissionRepo.create(user.id)
    submissionId = submission.id

    rubricScoresRepo = new SqliteRubricScoresRepository(db)
    mockLLM = new MockLLMProvider()
    scorer = new RubricScorerService(mockLLM, rubricScoresRepo)
  })

  it('scores a submission successfully', async () => {
    const scores = await scorer.scoreSubmission(
      submissionId,
      'The dragon flew over the mountain.',
      'Write a story about a dragon.'
    )

    expect(scores.status).toBe('scored')
    expect(scores.content).toBe(8)
    expect(scores.organization).toBe(7)
    expect(scores.vocabulary).toBe(6)
    expect(scores.grammar).toBe(9)
    expect(scores.spelling).toBe(8)
    expect(scores.submissionId).toBe(submissionId)
    expect(scores.llmModel).toBe('mock-scorer')
    expect(scores.llmTokensUsed).toBe(50)
  })

  it('calculates overall score as average of dimensions', async () => {
    const scores = await scorer.scoreSubmission(
      submissionId,
      'Some writing here.',
      'Write something.'
    )

    const expected = Math.round((8 + 7 + 6 + 9 + 8) / 5)
    expect(scores.overallScore).toBe(expected)
  })

  it('persists scores to the repository', async () => {
    await scorer.scoreSubmission(
      submissionId,
      'Some writing.',
      'Write something.'
    )

    const stored = rubricScoresRepo.findBySubmissionId(submissionId)
    expect(stored).not.toBeNull()
    expect(stored!.content).toBe(8)
    expect(stored!.status).toBe('scored')
  })

  it('retries once on JSON parse failure then succeeds', async () => {
    let callCount = 0
    mockLLM.response = {
      content: 'not valid json',
      tokensUsed: 50,
      model: 'mock-scorer',
    }

    const originalGenerate = mockLLM.generateResponse.bind(mockLLM)
    mockLLM.generateResponse = async (systemPrompt, userPrompt, options) => {
      callCount += 1
      if (callCount === 1) {
        return { content: 'not valid json', tokensUsed: 50, model: 'mock-scorer' }
      }
      return {
        content: '{"content":5,"organization":5,"vocabulary":5,"grammar":5,"spelling":5}',
        tokensUsed: 50,
        model: 'mock-scorer',
      }
    }

    const scores = await scorer.scoreSubmission(
      submissionId,
      'Some writing.',
      'Write something.'
    )

    expect(scores.status).toBe('scored')
    expect(scores.content).toBe(5)
    expect(callCount).toBe(2)
  })

  it('returns scoring_failed after all retries fail', async () => {
    mockLLM.shouldThrow = true

    const scores = await scorer.scoreSubmission(
      submissionId,
      'Some writing.',
      'Write something.'
    )

    expect(scores.status).toBe('scoring_failed')
    expect(scores.content).toBe(0)
    expect(scores.overallScore).toBe(0)
  })

  it('returns scoring_failed when JSON has invalid dimension values', async () => {
    mockLLM.response = {
      content: '{"content":15,"organization":7,"vocabulary":6,"grammar":9,"spelling":8}',
      tokensUsed: 50,
      model: 'mock-scorer',
    }

    const scores = await scorer.scoreSubmission(
      submissionId,
      'Some writing.',
      'Write something.'
    )

    expect(scores.status).toBe('scoring_failed')
  })

  it('handles JSON wrapped in extra text', async () => {
    mockLLM.response = {
      content: 'Here are the scores: {"content":7,"organization":6,"vocabulary":8,"grammar":7,"spelling":9} Great job!',
      tokensUsed: 50,
      model: 'mock-scorer',
    }

    const scores = await scorer.scoreSubmission(
      submissionId,
      'Some writing.',
      'Write something.'
    )

    expect(scores.status).toBe('scored')
    expect(scores.content).toBe(7)
    expect(scores.vocabulary).toBe(8)
  })

  it('sends prompt body in user prompt to LLM', async () => {
    await scorer.scoreSubmission(
      submissionId,
      'The dragon roared.',
      'Write about a dragon adventure.'
    )

    expect(mockLLM.calls).toHaveLength(1)
    expect(mockLLM.calls[0].userPrompt).toContain('Write about a dragon adventure.')
    expect(mockLLM.calls[0].userPrompt).toContain('The dragon roared.')
  })

  it('uses low temperature for scoring', async () => {
    await scorer.scoreSubmission(
      submissionId,
      'Test writing.',
      'Test prompt.'
    )

    expect(mockLLM.calls[0].options.temperature).toBe(0.1)
  })
})
