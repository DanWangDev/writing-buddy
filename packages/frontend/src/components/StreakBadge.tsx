interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
      <span className="text-lg" role="img" aria-label="fire">
        🔥
      </span>
      <span className="font-semibold text-orange-700">{streak}</span>
      <span className="text-sm text-orange-600">
        day{streak !== 1 ? 's' : ''} streak
      </span>
    </div>
  )
}
