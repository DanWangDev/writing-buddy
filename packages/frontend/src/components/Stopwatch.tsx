import { Timer, Pause, Play, RotateCcw } from 'lucide-react'
import { formatTime } from '../hooks/useStopwatch'

interface StopwatchProps {
  elapsed: number
  running: boolean
  onToggle: () => void
  onReset: () => void
  timeLimitMinutes?: number
}

export function Stopwatch({ elapsed, running, onToggle, onReset, timeLimitMinutes }: StopwatchProps) {
  const timeLimitSeconds = timeLimitMinutes ? timeLimitMinutes * 60 : undefined
  const isOverTime = timeLimitSeconds !== undefined && elapsed > timeLimitSeconds

  return (
    <div className={`inline-flex items-center gap-2 border-2 border-ink rounded-lg px-3 py-1.5 ${isOverTime ? 'bg-[#EF4444] text-white' : 'bg-warm-100'}`}>
      <Timer className={`w-4 h-4 ${isOverTime ? 'text-white' : 'text-sky'}`} />
      <span
        className={`font-mono text-base font-bold tabular-nums text-center ${isOverTime ? 'text-white' : 'text-warm-700'} ${elapsed >= 3600 ? 'min-w-[4.75rem]' : 'min-w-[3.5rem]'}`}
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
