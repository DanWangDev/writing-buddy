import type { CoachingPass } from '@writting-buddy/shared'
import type { LLMProvider } from '../llm/provider.js'
import type { ICoachingPassRepository } from '../../repositories/interfaces/coaching-pass-repository.js'
import type { ISubmissionRepository } from '../../repositories/interfaces/submission-repository.js'
import type { IRevisionRepository } from '../../repositories/interfaces/revision-repository.js'
import { ContentSafetyService } from '../content-safety.js'
import { buildContext } from './context-builder.js'
import { buildSystemPrompt, getNextPassType } from './prompts.js'
import { logger } from '../logger.js'

export interface AiCoachConfig {
  readonly freeTierDailySessions: number
  readonly dailySpendCeiling: number
  readonly costPerToken: number
}

const DEFAULT_CONFIG: AiCoachConfig = {
  freeTierDailySessions: 3,
  dailySpendCeiling: 50,
  costPerToken: 0.000003,
}

const FALLBACK_FEEDBACK =
  'Great work on your writing! Keep going — I\'ll have more specific feedback for you next time.'

const MAX_OUTPUT_TOKENS = 500

export class AiCoachService {
  private readonly llmProvider: LLMProvider
  private readonly coachingPassRepo: ICoachingPassRepository
  private readonly submissionRepo: ISubmissionRepository
  private readonly revisionRepo: IRevisionRepository
  private readonly contentSafety: ContentSafetyService
  private readonly config: AiCoachConfig

  constructor(
    llmProvider: LLMProvider,
    coachingPassRepo: ICoachingPassRepository,
    submissionRepo: ISubmissionRepository,
    revisionRepo: IRevisionRepository,
    contentSafety?: ContentSafetyService,
    config?: Partial<AiCoachConfig>
  ) {
    this.llmProvider = llmProvider
    this.coachingPassRepo = coachingPassRepo
    this.submissionRepo = submissionRepo
    this.revisionRepo = revisionRepo
    this.contentSafety = contentSafety ?? new ContentSafetyService()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async getNextPass(
    submissionId: string,
    userId: string
  ): Promise<CoachingPass> {
    const submission = this.submissionRepo.findById(submissionId)
    if (!submission) {
      throw new Error('Submission not found')
    }

    if (submission.userId !== userId) {
      throw new Error('Access denied')
    }

    if (submission.status === 'completed') {
      throw new Error('Submission is already completed')
    }

    const todayCount = this.coachingPassRepo.countTodayByUserId(userId)
    if (todayCount >= this.config.freeTierDailySessions) {
      throw new Error(
        `Daily coaching limit reached (${this.config.freeTierDailySessions} sessions per day)`
      )
    }

    const todayTokens = this.coachingPassRepo.sumTodayTokens()
    const todaySpend = todayTokens * this.config.costPerToken
    if (todaySpend >= this.config.dailySpendCeiling) {
      logger.error('Daily spend ceiling reached', {
        todayTokens,
        todaySpend,
        ceiling: this.config.dailySpendCeiling,
      })
      throw new Error('Service temporarily unavailable. Please try again tomorrow.')
    }

    const revisions = this.revisionRepo.findBySubmissionId(submissionId)
    if (revisions.length === 0) {
      throw new Error('No revisions found. Write something first!')
    }

    const latestRevision = revisions[revisions.length - 1]

    const inputScreening = await this.contentSafety.screenInput(
      latestRevision.content
    )
    if (!inputScreening.safe) {
      logger.warn('Input content flagged by safety screen', {
        submissionId,
        reason: inputScreening.reason,
      })
      throw new Error(
        'Your writing contains content that needs review. Please revise and try again.'
      )
    }

    const existingPasses =
      this.coachingPassRepo.findBySubmissionId(submissionId)
    const passType = getNextPassType(existingPasses.length)

    const systemPrompt = buildSystemPrompt({ passType })
    const context = buildContext({
      studentName: 'Writer',
      revisions,
      coachingPasses: existingPasses,
      systemPrompt,
    })

    let feedback: string
    let llmModel: string | undefined
    let llmTokensUsed: number | undefined

    try {
      const llmResponse = await this.llmProvider.generateResponse(
        context.systemPrompt,
        context.userPrompt,
        { maxTokens: MAX_OUTPUT_TOKENS, temperature: 0.7 }
      )

      feedback = llmResponse.content
      llmModel = llmResponse.model
      llmTokensUsed = llmResponse.tokensUsed

      const outputScreening = await this.contentSafety.filterOutput(feedback)
      if (!outputScreening.safe) {
        logger.warn('LLM output flagged by safety filter, retrying', {
          submissionId,
        })

        const retryResponse = await this.llmProvider.generateResponse(
          context.systemPrompt,
          context.userPrompt,
          { maxTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 }
        )

        feedback = retryResponse.content
        llmTokensUsed = (llmTokensUsed ?? 0) + retryResponse.tokensUsed

        const retryScreening = await this.contentSafety.filterOutput(feedback)
        if (!retryScreening.safe) {
          logger.error('LLM output failed safety filter after retry', {
            submissionId,
          })
          feedback = FALLBACK_FEEDBACK
        }
      }
    } catch (error) {
      logger.error('LLM call failed', {
        error: String(error),
        submissionId,
      })
      throw new Error(
        'Our AI coach is temporarily unavailable. Please try again in a moment.'
      )
    }

    const coachingPass = this.coachingPassRepo.create({
      submissionId,
      revisionNumber: latestRevision.revisionNumber,
      passType,
      feedback,
      llmModel,
      llmTokensUsed,
    })

    if (submission.status === 'draft') {
      this.submissionRepo.updateStatus(submissionId, 'in_coaching')
    }

    return coachingPass
  }
}
