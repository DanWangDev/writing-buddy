interface WordCounterProps {
  count: number
  target?: number
}

function getColor(count: number, target?: number): string {
  if (count < 50) return 'text-red-600'
  if (target && count < target) return 'text-yellow-600'
  return 'text-green-600'
}

export function WordCounter({ count, target }: WordCounterProps) {
  const color = getColor(count, target)

  return (
    <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${color}`}>
      <span>{count} word{count !== 1 ? 's' : ''}</span>
      {target ? (
        <span className="text-gray-400">/ {target} target</span>
      ) : null}
    </div>
  )
}
