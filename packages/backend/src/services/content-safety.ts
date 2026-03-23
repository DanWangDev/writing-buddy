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

const INAPPROPRIATE_OUTPUT_TERMS: ReadonlyArray<string> = [
  'profanity_placeholder',
  'damn',
  'hell',
  'crap',
  'stupid',
  'idiot',
  'dumb',
  'shut up',
  'loser',
  'hate you',
  'you suck',
  'kill',
  'die',
  'drug',
  'alcohol',
  'sexual',
  'violent',
]

function containsTerms(
  content: string,
  terms: ReadonlyArray<string>
): string | undefined {
  const lowered = content.toLowerCase()
  return terms.find((term) => lowered.includes(term))
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
      const matchedTerm = containsTerms(content, INAPPROPRIATE_OUTPUT_TERMS)
      if (matchedTerm) {
        logger.warn('Content safety: inappropriate output detected', {
          matchedTerm,
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
