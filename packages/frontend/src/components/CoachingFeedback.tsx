import type { CoachingPass, PassType } from '@writting-buddy/shared'
import { MessageCircle, HelpCircle, Lightbulb, Sparkles, Wand2, SpellCheck, BookA, Loader2 } from 'lucide-react'

const PASS_CONFIG: Record<
  PassType,
  { label: string; bgClass: string; borderClass: string; textClass: string; icon: typeof MessageCircle }
> = {
  acknowledgment: {
    label: 'Acknowledgment',
    bgClass: 'bg-green-50',
    borderClass: 'border-l-4 border-l-green-500 border border-green-200',
    textClass: 'text-green-700',
    icon: MessageCircle,
  },
  guiding_questions: {
    label: 'Guiding Questions',
    bgClass: 'bg-sky/5',
    borderClass: 'border-l-4 border-l-sky border border-sky-light/50',
    textClass: 'text-sky-dark',
    icon: HelpCircle,
  },
  suggestions: {
    label: 'Suggestions',
    bgClass: 'bg-coral/5',
    borderClass: 'border-l-4 border-l-coral border border-coral-light/50',
    textClass: 'text-coral-dark',
    icon: Lightbulb,
  },
  polish: {
    label: 'Polish',
    bgClass: 'bg-violet/5',
    borderClass: 'border-l-4 border-l-violet border border-violet-light/50',
    textClass: 'text-violet-dark',
    icon: Sparkles,
  },
}

export type ApplyMode = 'grammar' | 'vocabulary' | 'improve'

interface CoachingFeedbackProps {
  pass: CoachingPass
  passNumber: number
  onApply?: (feedback: string, mode: ApplyMode) => void
  applying?: boolean
  isCompleted?: boolean
}

export function CoachingFeedback({ pass, passNumber, onApply, applying, isCompleted }: CoachingFeedbackProps) {
  const config = PASS_CONFIG[pass.passType]
  const Icon = config.icon
  const showApplyButtons = onApply && !isCompleted && (pass.passType === 'suggestions' || pass.passType === 'guiding_questions' || pass.passType === 'polish')

  return (
    <div className={`rounded-[12px] p-4 ${config.bgClass} ${config.borderClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${config.textClass}`} />
        <span className={`font-semibold text-sm ${config.textClass}`}>
          Pass {passNumber}: {config.label}
        </span>
      </div>
      <div className="text-warm-700 text-sm whitespace-pre-wrap leading-relaxed">
        {pass.feedback}
      </div>

      {showApplyButtons && (
        <div className="mt-3 pt-3 border-t border-warm-200/50 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onApply(pass.feedback, 'improve')}
            disabled={applying}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet/10 text-violet-dark hover:bg-violet/20 transition-colors disabled:opacity-50"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Apply Suggestions
          </button>
          <button
            type="button"
            onClick={() => onApply(pass.feedback, 'grammar')}
            disabled={applying}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky/10 text-sky-dark hover:bg-sky/20 transition-colors disabled:opacity-50"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SpellCheck className="w-3.5 h-3.5" />}
            Fix Grammar
          </button>
          <button
            type="button"
            onClick={() => onApply(pass.feedback, 'vocabulary')}
            disabled={applying}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gold/10 text-gold-dark hover:bg-gold/20 transition-colors disabled:opacity-50"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookA className="w-3.5 h-3.5" />}
            Improve Vocabulary
          </button>
        </div>
      )}
    </div>
  )
}
