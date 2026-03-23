interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-coral/10 border border-coral-light rounded-full">
      <span className="text-lg" role="img" aria-label="fire">
        🔥
      </span>
      <span className="font-bold text-coral-dark">{streak}</span>
      <span className="text-sm font-semibold text-coral">
        day{streak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
