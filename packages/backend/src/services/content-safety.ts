import { logger } from './logger.js'

export interface SafetyScreenResult {
  readonly safe: boolean
  readonly reason?: string
}

const CONCERNING_INPUT_TERMS: ReadonlyArray<string> = [
  'suicide',
  'self-harm',
  'kill myself',
  'want to die',
  'hurt myself',
  'abuse',
  'molest',
  'assault',
  'trafficking',
  'weapon instructions',
  'bomb making',
  'drug recipe',
]

/**
 * Output filter for coaching feedback.
 * Uses word-boundary matching to avoid false positives on legitimate words
 * like "skills" (contains "kill"), "audience" (contains "die"), etc.
 *
 * Only flags terms that are genuinely inappropriate for a writing coach
 * to say to a 10-11 year old student. Terms that could legitimately appear
 * in feedback about creative writing stories are excluded.
 */
const INAPPROPRIATE_OUTPUT_PATTERNS: ReadonlyArray<RegExp> = [
  // Direct insults a coach should never use
  /\bstupid\b/i,
  /\bidiot\b/i,
  /\bdumb\b/i,
  /\bshut up\b/i,
  /\bloser\b/i,
  /\bhate you\b/i,
  /\byou suck\b/i,
  // Profanity
  /\bdamn\b/i,
  /\bcrap\b/i,
  /\bhell\b/i,
  // Genuinely inappropriate coach behavior
  /\bgive up\b/i,
  /\byou('re| are) (bad|terrible|awful|hopeless)\b/i,
]

function containsTerms(
  content: string,
  terms: ReadonlyArray<string>
): string | undefined {
  const lowered = content.toLowerCase()
  return terms.find((term) => lowered.includes(term))
}

function matchesPatterns(
  content: string,
  patterns: ReadonlyArray<RegExp>
): string | undefined {
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      return pattern.source
    }
  }
  return undefined
}

export class ContentSafetyService {
  async screenInput(content: string): Promise<SafetyScreenResult> {
    try {
      const matchedTerm = containsTerms(content, CONCERNING_INPUT_TERMS)
      if (matchedTerm) {
        logger.warn('Content safety: concerning input detected', {
          matchedTerm,
          contentLength: content.length,
        })
        return {
          safe: false,
          reason: `Content flagged for review: concerning language detected`,
        }
      }
      return { safe: true }
    } catch (error) {
      logger.error('Content safety classifier error (screenInput)', {
        error: String(error),
      })
      return { safe: true }
    }
  }

  async filterOutput(content: string): Promise<SafetyScreenResult> {
    try {
      const matchedPattern = matchesPatterns(content, INAPPROPRIATE_OUTPUT_PATTERNS)
      if (matchedPattern) {
        logger.warn('Content safety: inappropriate output detected', {
          matchedPattern,
          contentLength: content.length,
        })
        return {
          safe: false,
          reason: `Output filtered: inappropriate language detected`,
        }
      }
      return { safe: true }
    } catch (error) {
      logger.error('Content safety classifier error (filterOutput)', {
        error: String(error),
      })
      return { safe: true }
    }
  }
}
