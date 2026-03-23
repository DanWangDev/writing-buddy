import { describe, it, expect } from 'vitest'
import type { Revision, CoachingPass } from '@writting-buddy/shared'
import { buildContext } from '../services/coaching/context-builder.js'

function makeRevision(overrides: Partial<Revision> = {}): Revision {
  return {
    id: 'rev-1',
    submissionId: 'sub-1',
    revisionNumber: 1,
    content: 'The dragon breathed fire on the village below.',
    wordCount: 8,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeCoachingPass(overrides: Partial<CoachingPass> = {}): CoachingPass {
  return {
    id: 'pass-1',
    submissionId: 'sub-1',
    revisionNumber: 1,
    passType: 'acknowledgment',
    feedback: 'Great opening! I love how you started with action.',
    createdAt: '2026-01-01T01:00:00Z',
    ...overrides,
  }
}

describe('buildContext', () => {
  it('builds context with a single revision', () => {
    const result = buildContext({
      studentName: 'Alice',
      revisions: [makeRevision()],
      coachingPasses: [],
      systemPrompt: 'You are a writing coach.',
    })

    expect(result.userPrompt).toContain('Alice')
    expect(result.userPrompt).toContain('The dragon breathed fire')
    expect(result.systemPrompt).toBe('You are a writing coach.')
    expect(result.estimatedTokens).toBeGreaterThan(0)
  })

  it('includes prompt info when provided', () => {
    const result = buildContext({
      studentName: 'Bob',
      promptTitle: 'Dragon Adventure',
      promptBody: 'Write a story about a dragon.',
      revisions: [makeRevision()],
      coachingPasses: [],
      systemPrompt: 'Coach prompt.',
    })

    expect(result.userPrompt).toContain('Dragon Adventure')
    expect(result.userPrompt).toContain('Write a story about a dragon.')
  })

  it('summarizes prior revisions with coaching feedback', () => {
    const revisions = [
      makeRevision({
        id: 'rev-1',
        revisionNumber: 1,
        content: 'First draft here.',
        wordCount: 3,
      }),
      makeRevision({
        id: 'rev-2',
        revisionNumber: 2,
        content: 'Second draft with more words and better details.',
        wordCount: 8,
      }),
    ]

    const passes = [
      makeCoachingPass({
        revisionNumber: 1,
        feedback: 'Nice start! Try adding more detail.',
      }),
    ]

    const result = buildContext({
      studentName: 'Carol',
      revisions,
      coachingPasses: passes,
      systemPrompt: 'System.',
    })

    expect(result.userPrompt).toContain('Prior revision history')
    expect(result.userPrompt).toContain('Revision 1')
    expect(result.userPrompt).toContain('Nice start!')
    expect(result.userPrompt).toContain('Second draft with more words')
  })

  it('includes diff summary between revisions', () => {
    const revisions = [
      makeRevision({
        revisionNumber: 1,
        content: 'Short.',
        wordCount: 1,
      }),
      makeRevision({
        revisionNumber: 2,
        content: 'Longer content with many more words added to the text.',
        wordCount: 10,
      }),
    ]

    const result = buildContext({
      studentName: 'Dave',
      revisions,
      coachingPasses: [],
      systemPrompt: 'System.',
    })

    expect(result.userPrompt).toContain('Changes from last revision')
    expect(result.userPrompt).toContain('+9 words')
  })

  it('estimates tokens and warns if over budget', () => {
    const longContent = 'word '.repeat(8000)
    const revisions = [
      makeRevision({ content: longContent, wordCount: 8000 }),
    ]

    const result = buildContext({
      studentName: 'Eve',
      revisions,
      coachingPasses: [],
      systemPrompt: 'System.',
    })

    expect(result.estimatedTokens).toBeGreaterThan(6000)
  })

  it('throws when no revisions provided', () => {
    expect(() =>
      buildContext({
        studentName: 'Frank',
        revisions: [],
        coachingPasses: [],
        systemPrompt: 'System.',
      })
    ).toThrow('No revisions available')
  })
})
