import { Confetti } from './Confetti'
import { InkwellWriting } from './inkwell'
import type { CelebrationType } from '../hooks/useCelebration'

interface CelebrationOverlayProps {
  type: CelebrationType
  message: string
  onDismiss: () => void
}

export function CelebrationOverlay({ type, message, onDismiss }: CelebrationOverlayProps) {
  const isCompletion = type === 'completion'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      onClick={onDismiss}
      role="status"
      aria-live="polite"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-warm-900/20 backdrop-blur-[2px]" />

      {/* Confetti */}
      <Confetti />

      {/* Message card */}
      <div
        className="relative z-10 card-clay-static bg-white p-8 text-center max-w-sm mx-4"
        style={{ animation: 'celebration-pop 0.4s ease-out forwards' }}
      >
        <InkwellWriting
          className="mx-auto mb-3"
          width={isCompletion ? 100 : 80}
          height={isCompletion ? 110 : 88}
        />
        <h2 className="font-display text-2xl font-bold text-warm-800 mb-1">
          {isCompletion ? 'Story Complete!' : 'Nice Work!'}
        </h2>
        <p className="text-warm-500 text-base">{message}</p>
        {isCompletion && (
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="text-gold text-2xl"
                style={{
                  animation: `celebration-pop 0.3s ease-out ${0.1 * i + 0.3}s both`,
                }}
                aria-hidden="true"
              >
                &#9733;
              </span>
            ))}
          </div>
        )}
        <p className="text-warm-400 text-xs mt-4">Tap anywhere to continue</p>
      </div>
    </div>
  )
}
