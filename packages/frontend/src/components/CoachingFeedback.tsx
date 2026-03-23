import type { CoachingPass, PassType } from '@writting-buddy/shared'
import { MessageCircle, HelpCircle, Lightbulb, Sparkles } from 'lucide-react'

const PASS_CONFIG: Record<
  PassType,
  { label: string; bgClass: string; borderClass: string; textClass: string; icon: typeof MessageCircle }
> = {
  acknowledgment: {
    label: 'Acknowledgment',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
    icon: MessageCircle,
  },
  guiding_questions: {
    label: 'Guiding Questions',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    icon: HelpCircle,
  },
  suggestions: {
    label: 'Suggestions',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    icon: Lightbulb,
  },
  polish: {
    label: 'Polish',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
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
    <div className={`rounded-xl border p-4 ${config.bgClass} ${config.borderClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${config.textClass}`} />
        <span className={`font-semibold text-sm ${config.textClass}`}>
          Pass {passNumber}: {config.label}
        </span>
      </div>
      <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
        {pass.feedback}
      </div>
    </div>
  )
}
