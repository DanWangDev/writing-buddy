import { Timer, Pause, Play, RotateCcw } from 'lucide-react'
import { formatTime } from '../hooks/useStopwatch'

interface StopwatchProps {
  elapsed: number
  running: boolean
  onToggle: () => void
  onReset: () => void
}

export function Stopwatch({ elapsed, running, onToggle, onReset }: StopwatchProps) {
  return (
    <div className="inline-flex items-center gap-2 card-clay-static px-3 py-1.5">
      <Timer className="w-4 h-4 text-sky" />
      <span
        className="font-mono text-base font-bold text-warm-700 tabular-nums min-w-[3.5rem] text-center"
        aria-label={`Writing time: ${formatTime(elapsed)}`}
        role="timer"
      >
        {formatTime(elapsed)}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors text-warm-500 hover:text-warm-700"
        aria-label={running ? 'Pause timer' : 'Start timer'}
      >
        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      {elapsed > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors text-warm-400 hover:text-warm-600"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
