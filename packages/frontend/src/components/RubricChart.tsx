import type { RubricScores } from '@writting-buddy/shared'
import { AlertTriangle } from 'lucide-react'

const DIMENSIONS = [
  { key: 'content' as const, label: 'Content' },
  { key: 'organization' as const, label: 'Organization' },
  { key: 'vocabulary' as const, label: 'Vocabulary' },
  { key: 'grammar' as const, label: 'Grammar' },
  { key: 'spelling' as const, label: 'Spelling' },
]

interface RubricChartProps {
  scores: RubricScores
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  const barColor =
    score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600 w-28">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">
        {score}
      </span>
    </div>
  )
}

export function RubricChart({ scores }: RubricChartProps) {
  if (scores.status === 'scoring_failed') {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
        <p className="text-sm text-yellow-700">
          Scoring could not be completed for this submission. Keep writing and try again!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Your Scores</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-indigo-600">
            {scores.overallScore}
          </span>
          <span className="text-sm text-gray-400">/ 50</span>
        </div>
      </div>
      <div className="space-y-3">
        {DIMENSIONS.map((dim) => (
          <ScoreBar key={dim.key} label={dim.label} score={scores[dim.key]} />
        ))}
      </div>
    </div>
  )
}
