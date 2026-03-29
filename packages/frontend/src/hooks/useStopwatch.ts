import { useState, useCallback, useRef, useEffect } from 'react'

interface StopwatchState {
  /** Elapsed seconds */
  elapsed: number
  /** Whether the stopwatch is currently ticking */
  running: boolean
}

export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>({ elapsed: 0, running: false })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return // already running
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const total = accumulatedRef.current + Math.floor((now - startTimeRef.current!) / 1000)
      setState({ elapsed: total, running: true })
    }, 1000)
    setState((prev) => ({ ...prev, running: true }))
  }, [])

  const pause = useCallback(() => {
    if (!intervalRef.current) return
    const now = Date.now()
    accumulatedRef.current += Math.floor((now - (startTimeRef.current ?? now)) / 1000)
    startTimeRef.current = null
    clearTick()
    setState((prev) => ({ ...prev, running: false }))
  }, [clearTick])

  const toggle = useCallback(() => {
    if (intervalRef.current) {
      pause()
    } else {
      start()
    }
  }, [start, pause])

  const reset = useCallback(() => {
    clearTick()
    accumulatedRef.current = 0
    startTimeRef.current = null
    setState({ elapsed: 0, running: false })
  }, [clearTick])

  // Cleanup on unmount
  useEffect(() => clearTick, [clearTick])

  return {
    elapsed: state.elapsed,
    running: state.running,
    start,
    pause,
    toggle,
    reset,
  }
}

/** Format seconds into MM:SS or H:MM:SS when over an hour */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
