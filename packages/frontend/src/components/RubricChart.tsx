import type { RubricScores } from '@writing-buddy/shared'
import type { RubricCategory } from '../services/api'
import { AlertTriangle, Loader2 } from 'lucide-react'

const DIMENSIONS: ReadonlyArray<{ key: RubricCategory; label: string }> = [
  { key: 'content', label: 'Content' },
  { key: 'organization', label: 'Organization' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'spelling', label: 'Spelling' },
]

interface RubricChartProps {
  scores: RubricScores
  activeCategory?: RubricCategory | null
  loadingCategory?: RubricCategory | null
  onToggleCategory?: (category: RubricCategory) => void
}

function ScoreBar({
  label,
  score,
  active,
  loading,
  onClick,
}: {
  label: string
  score: number
  active: boolean
  loading: boolean
  onClick?: () => void
}) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  const barColor =
    score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-gold' : 'bg-coral'

  const isClickable = !!onClick

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`flex items-center gap-3 w-full rounded-lg px-2 py-1.5 transition-all ${
        active
          ? 'bg-sky/10 ring-2 ring-sky/40'
          : isClickable
            ? 'hover:bg-warm-50 cursor-pointer'
            : ''
      } ${!isClickable ? 'cursor-default' : ''}`}
    >
      <span className={`text-sm font-semibold w-28 text-left ${active ? 'text-sky' : 'text-warm-600'}`}>
        {label}
        {loading && <Loader2 className="w-3 h-3 inline-block ml-1 animate-spin" />}
      </span>
      <div className="flex-1 h-3 bg-warm-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-sky' : barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-warm-700 w-8 text-right tabular-nums">
        {score}
      </span>
    </button>
  )
}

export function RubricChart({ scores, activeCategory, loadingCategory, onToggleCategory }: RubricChartProps) {
  if (scores.status === 'scoring_failed') {
    return (
      <div className="rounded-[12px] border-l-4 border-l-gold border border-gold-light/50 bg-gold/5 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-gold-dark shrink-0" />
        <p className="text-sm text-warm-700">
          Scoring could not be completed for this submission. Keep writing and try again!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-warm-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-warm-800">Your Scores</h3>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-sky">
            {scores.overallScore}
          </span>
          <span className="text-sm text-warm-400">/ 50</span>
        </div>
      </div>
      <div className="space-y-1">
        {DIMENSIONS.map((dim) => (
          <ScoreBar
            key={dim.key}
            label={dim.label}
            score={scores[dim.key]}
            active={activeCategory === dim.key}
            loading={loadingCategory === dim.key}
            onClick={onToggleCategory ? () => onToggleCategory(dim.key) : undefined}
          />
        ))}
      </div>
      {onToggleCategory && (
        <p className="text-xs text-warm-400 mt-3 text-center">
          Tap a category to see AI suggestions
        </p>
      )}
    </div>
  )
}
