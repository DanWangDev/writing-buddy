import { useState, useCallback, useRef } from 'react'

export type CelebrationType = 'coaching' | 'completion'

interface CelebrationState {
  active: boolean
  type: CelebrationType
  message: string
}

const COACHING_MESSAGES = [
  'Great work! Keep going!',
  'Your story is getting better!',
  'Awesome progress!',
  'You\'re on a roll!',
  'Brilliant writing!',
]

const COMPLETION_MESSAGES = [
  'You did it! Amazing story!',
  'Story complete! Well done!',
  'Fantastic work, author!',
  'What a great story!',
  'You\'re a star writer!',
]

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

export function useCelebration(duration = 2500) {
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback((type: CelebrationType) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const messages = type === 'coaching' ? COACHING_MESSAGES : COMPLETION_MESSAGES
    setCelebration({ active: true, type, message: pickRandom(messages) })

    timerRef.current = setTimeout(() => {
      setCelebration(null)
      timerRef.current = null
    }, duration)
  }, [duration])

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setCelebration(null)
  }, [])

  return { celebration, trigger, dismiss }
}
