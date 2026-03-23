interface WordCounterProps {
  count: number
  target?: number
}

function getColor(count: number, target?: number): string {
  if (count < 50) return 'text-coral'
  if (target && count < target) return 'text-gold-dark'
  return 'text-green-600'
}

export function WordCounter({ count, target }: WordCounterProps) {
  const color = getColor(count, target)

  return (
    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${color}`}>
      <span>{count} word{count !== 1 ? 's' : ''}</span>
      {target ? (
        <span className="text-warm-400">/ {target} target</span>
      ) : null}
    </div>
  )
}
