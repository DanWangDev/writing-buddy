import type { Revision, CoachingPass } from '@writting-buddy/shared'
import { logger } from '../logger.js'

interface RevisionSummary {
  readonly revisionNumber: number
  readonly wordCount: number
  readonly paragraphCount: number
  readonly coachingFeedback?: string
}

interface ContextInput {
  readonly studentName: string
  readonly promptTitle?: string
  readonly promptBody?: string
  readonly revisions: ReadonlyArray<Revision>
  readonly coachingPasses: ReadonlyArray<CoachingPass>
  readonly systemPrompt: string
}

interface BuiltContext {
  readonly systemPrompt: string
  readonly userPrompt: string
  readonly estimatedTokens: number
}

const CHARS_PER_TOKEN = 4
const TOKEN_BUDGET_WARNING = 6000

function countParagraphs(content: string): number {
  return content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function summarizeRevision(
  revision: Revision,
  relatedPass?: CoachingPass
): RevisionSummary {
  return {
    revisionNumber: revision.revisionNumber,
    wordCount: revision.wordCount,
    paragraphCount: countParagraphs(revision.content),
    coachingFeedback: relatedPass?.feedback,
  }
}

function buildRevisionHistory(
  revisions: ReadonlyArray<Revision>,
  passes: ReadonlyArray<CoachingPass>
): string {
  if (revisions.length <= 1) {
    return ''
  }

  const priorRevisions = revisions.slice(0, -1)
  const summaries = priorRevisions.map((rev) => {
    const relatedPass = passes.find(
      (p) => p.revisionNumber === rev.revisionNumber
    )
    return summarizeRevision(rev, relatedPass)
  })

  const lines = summaries.map((s) => {
    const parts = [
      `Revision ${s.revisionNumber}: ${s.wordCount} words, ${s.paragraphCount} paragraphs`,
    ]
    if (s.coachingFeedback) {
      parts.push(`Coach feedback: "${s.coachingFeedback.slice(0, 200)}"`)
    }
    return parts.join('\n  ')
  })

  return ['Prior revision history:', ...lines].join('\n')
}

function buildDiffSummary(
  revisions: ReadonlyArray<Revision>
): string {
  if (revisions.length < 2) {
    return ''
  }

  const previous = revisions[revisions.length - 2]
  const latest = revisions[revisions.length - 1]

  const wordDiff = latest.wordCount - previous.wordCount
  const paragraphDiff =
    countParagraphs(latest.content) - countParagraphs(previous.content)

  const wordChange =
    wordDiff > 0
      ? `+${wordDiff} words`
      : wordDiff < 0
        ? `${wordDiff} words`
        : 'same word count'

  const paragraphChange =
    paragraphDiff > 0
      ? `+${paragraphDiff} paragraphs`
      : paragraphDiff < 0
        ? `${paragraphDiff} paragraphs`
        : 'same paragraph count'

  return `Changes from last revision: ${wordChange}, ${paragraphChange}`
}

export function buildContext(input: ContextInput): BuiltContext {
  const {
    studentName,
    promptTitle,
    promptBody,
    revisions,
    coachingPasses,
    systemPrompt,
  } = input

  const latestRevision = revisions[revisions.length - 1]
  if (!latestRevision) {
    throw new Error('No revisions available to build context')
  }

  const sections: string[] = [
    `Student name: ${studentName}`,
  ]

  if (promptTitle) {
    sections.push(`Writing prompt: "${promptTitle}"`)
  }
  if (promptBody) {
    sections.push(`Prompt details: ${promptBody}`)
  }

  const revisionHistory = buildRevisionHistory(revisions, coachingPasses)
  if (revisionHistory) {
    sections.push(revisionHistory)
  }

  const diffSummary = buildDiffSummary(revisions)
  if (diffSummary) {
    sections.push(diffSummary)
  }

  sections.push(
    `Current revision (#${latestRevision.revisionNumber}, ${latestRevision.wordCount} words):`,
    latestRevision.content
  )

  const userPrompt = sections.join('\n\n')
  const estimatedTokens =
    estimateTokens(systemPrompt) + estimateTokens(userPrompt)

  if (estimatedTokens > TOKEN_BUDGET_WARNING) {
    logger.warn('Context exceeds token budget warning', {
      estimatedTokens,
      budget: TOKEN_BUDGET_WARNING,
    })
  }

  return {
    systemPrompt,
    userPrompt,
    estimatedTokens,
  }
}
