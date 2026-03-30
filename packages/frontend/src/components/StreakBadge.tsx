interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-coral border-2 border-ink rounded-full shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
      <span className="text-lg" role="img" aria-label="fire">
        🔥
      </span>
      <span className="font-bold text-white">{streak}</span>
      <span className="text-sm font-bold text-white">
        day{streak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
