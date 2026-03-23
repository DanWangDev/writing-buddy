import type { CoachingPass, PassType } from '@writting-buddy/shared'
import { MessageCircle, HelpCircle, Lightbulb, Sparkles } from 'lucide-react'

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

interface CoachingFeedbackProps {
  pass: CoachingPass
  passNumber: number
}

export function CoachingFeedback({ pass, passNumber }: CoachingFeedbackProps) {
  const config = PASS_CONFIG[pass.passType]
  const Icon = config.icon

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
    </div>
  )
}
