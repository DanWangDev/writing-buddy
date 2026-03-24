import { InkwellWriting } from './InkwellWriting'
import { InkwellThinking } from './InkwellThinking'
import { InkwellSleeping } from './InkwellSleeping'
import { InkwellCelebration } from './InkwellCelebration'

interface Props {
  className?: string
  variant?: 'default' | 'writing' | 'portal' | 'prompts'
}

/** Inkwell cat background decorations + game-inspired margin doodles */
export function MarginDoodles({ className = '', variant = 'default' }: Props) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      {/* === Inkwell cat background — visible at 15-20% opacity === */}

      {/* Default/Dashboard: Writing Inkwell bottom-right */}
      {variant === 'default' && (
        <div className="absolute -bottom-4 -right-2 opacity-[0.15] hidden sm:block">
          <InkwellWriting width={180} height={198} />
        </div>
      )}

      {/* Writing desk: Thinking Inkwell bottom-right */}
      {variant === 'writing' && (
        <div className="absolute -bottom-2 -right-4 opacity-[0.12] hidden sm:block">
          <InkwellThinking width={160} height={176} />
        </div>
      )}

      {/* Portfolio: Sleeping Inkwell bottom-left */}
      {variant === 'portal' && (
        <div className="absolute -bottom-2 -left-2 opacity-[0.14] hidden sm:block">
          <InkwellSleeping width={170} height={153} />
        </div>
      )}

      {/* Prompts: Celebration Inkwell bottom-right */}
      {variant === 'prompts' && (
        <div className="absolute -bottom-4 -right-2 opacity-[0.14] hidden sm:block">
          <InkwellCelebration width={160} height={176} />
        </div>
      )}

      {/* === Game-inspired margin doodles (subtle accents) === */}

      {/* Top-right: blocky world elements */}
      <svg
        className="absolute top-3 right-4 w-16 h-16 sm:w-20 sm:h-20 opacity-[0.10]"
        viewBox="0 0 80 80"
        fill="none"
      >
        <g stroke="#44403C" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <rect x="10" y="10" width="16" height="16" rx="1" fill="#22C55E" />
          <rect x="10" y="14" width="16" height="12" fill="#8B6914" stroke="none" />
          <rect x="30" y="18" width="16" height="16" rx="1" fill="#22C55E" />
          <rect x="30" y="22" width="16" height="12" fill="#8B6914" stroke="none" />
          <path d="M 58 15 L 65 8 L 72 15 L 65 28 Z" fill="#93C5FD" />
          {variant === 'writing' && (
            <line x1="55" y1="45" x2="70" y2="65" stroke="#FBBF24" strokeWidth="3" />
          )}
        </g>
      </svg>

      {/* Bottom-left: bean silhouette + stars */}
      {variant !== 'portal' && (
        <svg
          className="absolute bottom-4 left-3 w-14 h-14 sm:w-18 sm:h-18 opacity-[0.10]"
          viewBox="0 0 70 60"
          fill="none"
        >
          <g stroke="#44403C" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <path d="M 10 25 C 8 16, 15 8, 22 8 C 29 8, 35 14, 35 25 L 35 42 C 35 48, 30 50, 28 50 L 28 40 C 26 37, 22 37, 22 40 L 22 50 L 20 50 C 15 50, 10 46, 10 42 Z" fill="#EF4444" />
            <circle cx="55" cy="18" r="1.5" fill="#FBBF24" stroke="none" />
            <circle cx="50" cy="32" r="1" fill="#FBBF24" stroke="none" />
            <circle cx="60" cy="40" r="2" fill="#FBBF24" stroke="none" />
            <line x1="55" y1="18" x2="50" y2="32" strokeWidth="0.8" stroke="#FBBF24" opacity="0.5" />
            <line x1="50" y1="32" x2="60" y2="40" strokeWidth="0.8" stroke="#FBBF24" opacity="0.5" />
          </g>
        </svg>
      )}

      {/* Mid-right: primogem + elemental orb (skip on variants with Inkwell on the right) */}
      {(variant === 'portal') && (
        <svg
          className="absolute top-1/2 right-2 -translate-y-1/2 w-12 h-14 sm:w-14 sm:h-16 opacity-[0.09]"
          viewBox="0 0 50 60"
          fill="none"
        >
          <g stroke="#44403C" strokeWidth="1.5" fill="none">
            <path d="M 15 10 L 25 2 L 35 10 L 35 30 L 25 38 L 15 30 Z" fill="#A78BFA" />
            <path d="M 25 2 L 25 38" strokeWidth="0.8" opacity="0.3" />
            <circle cx="25" cy="50" r="8" fill="#93C5FD" opacity="0.4" />
            <path d="M 25 44 C 25 47, 21 50, 25 55 C 29 50, 25 47, 25 44 Z" fill="#0EA5E9" opacity="0.5" stroke="none" />
          </g>
        </svg>
      )}

      {/* Top-left: supply drop / chest (only on some variants) */}
      {(variant === 'portal' || variant === 'prompts') && (
        <svg
          className="absolute top-5 left-5 w-12 h-14 opacity-[0.09]"
          viewBox="0 0 50 55"
          fill="none"
        >
          <g stroke="#44403C" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <rect x="5" y="22" width="30" height="22" rx="3" fill="#FBBF24" />
            <path d="M 5 22 C 5 14, 35 14, 35 22" fill="#D97706" opacity="0.4" />
            <circle cx="20" cy="33" r="3" fill="#D97706" opacity="0.5" />
            {/* Parachute lines */}
            <path d="M 10 8 C 10 0, 30 0, 30 8" strokeWidth="1" />
            <line x1="10" y1="8" x2="12" y2="22" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="30" y1="8" x2="28" y2="22" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
        </svg>
      )}

      {/* Bottom-right: constellation dots (only on variants without Inkwell bottom-right) */}
      {variant === 'portal' && (
        <svg
          className="absolute bottom-6 right-8 w-16 h-12 opacity-[0.08]"
          viewBox="0 0 60 45"
          fill="none"
        >
          <g fill="none">
            <circle cx="8" cy="20" r="2.5" fill="#FBBF24" />
            <circle cx="28" cy="8" r="2" fill="#FBBF24" />
            <circle cx="45" cy="22" r="2.5" fill="#FBBF24" />
            <circle cx="30" cy="35" r="2" fill="#FBBF24" />
            <line x1="8" y1="20" x2="28" y2="8" stroke="#FBBF24" strokeWidth="0.8" opacity="0.5" />
            <line x1="28" y1="8" x2="45" y2="22" stroke="#FBBF24" strokeWidth="0.8" opacity="0.5" />
            <line x1="45" y1="22" x2="30" y2="35" stroke="#FBBF24" strokeWidth="0.8" opacity="0.5" />
            <line x1="30" y1="35" x2="8" y2="20" stroke="#FBBF24" strokeWidth="0.8" opacity="0.5" />
          </g>
        </svg>
      )}
    </div>
  )
}
