interface Props {
  className?: string
  width?: number
  height?: number
}

export function InkwellSleeping({ className = '', width = 200, height = 180 }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Body curled up */}
        <path d="M 45 110 C 40 85, 52 68, 100 65 C 148 62, 160 80, 155 110 C 150 128, 48 130, 45 110 Z" fill="#FAFAF9" />
        {/* Head resting */}
        <ellipse cx="90" cy="82" rx="30" ry="24" fill="#FAFAF9" transform="rotate(-10 90 82)" />
        {/* Ears flat */}
        <path d="M 66 64 L 54 46 L 74 58" fill="#FAFAF9" />
        <path d="M 108 58 L 115 38 L 98 54" fill="#FAFAF9" />
        <path d="M 65 60 L 57 50 L 71 58" stroke="#F97316" strokeWidth="1.5" />
        <path d="M 109 55 L 113 42 L 100 53" stroke="#F97316" strokeWidth="1.5" />
        {/* Ink splatter */}
        <circle cx="88" cy="62" r="4" fill="#44403C" stroke="none" />
        <circle cx="84" cy="60" r="2" fill="#44403C" stroke="none" />
        {/* Closed eyes */}
        <path d="M 76 78 C 80 72, 88 72, 92 78" strokeWidth="2.5" />
        <path d="M 96 76 C 100 70, 108 70, 112 76" strokeWidth="2.5" />
        {/* Nose */}
        <path d="M 92 85 L 96 85 L 94 88 Z" fill="#F97316" />
        {/* Sleepy smile */}
        <path d="M 88 92 C 91 94, 97 94, 100 92" strokeWidth="1.5" />
        {/* Whiskers droopy */}
        <line x1="62" y1="84" x2="76" y2="83" strokeWidth="1.5" />
        <line x1="110" y1="80" x2="126" y2="78" strokeWidth="1.5" />
        {/* Scarf as blanket */}
        <path d="M 55 100 C 60 95, 70 92, 90 90 C 110 88, 135 92, 145 98" stroke="#A78BFA" strokeWidth="4" opacity="0.6" />
        {/* Paws tucked */}
        <path d="M 74 94 C 68 92, 62 86, 64 80" strokeWidth="2" />
        <path d="M 106 92 C 112 90, 118 84, 116 78" strokeWidth="2" />
        {/* Tail wrapped with ink tip */}
        <path d="M 155 108 C 165 100, 170 85, 162 70 C 155 60, 145 62, 140 68" strokeWidth="2.5" />
        <circle cx="139" cy="69" r="3.5" fill="#44403C" stroke="none" />
        {/* Z Z Z */}
        <text x="125" y="48" fontFamily="Comic Neue, cursive" fontSize="18" fontWeight="bold" fill="#A78BFA" stroke="none" opacity="0.6">z</text>
        <text x="136" y="32" fontFamily="Comic Neue, cursive" fontSize="24" fontWeight="bold" fill="#A78BFA" stroke="none" opacity="0.5">z</text>
        <text x="150" y="14" fontFamily="Comic Neue, cursive" fontSize="30" fontWeight="bold" fill="#A78BFA" stroke="none" opacity="0.4">Z</text>
        {/* Book underneath */}
        <path d="M 30 125 L 100 135 L 170 125" strokeWidth="2" />
        <path d="M 30 125 L 30 145 L 100 155 L 100 135" fill="white" strokeWidth="2" />
        <path d="M 170 125 L 170 145 L 100 155 L 100 135" fill="white" strokeWidth="2" />
        {/* Knocked over ink bottle */}
        <rect x="155" y="135" width="12" height="14" rx="2" fill="#44403C" transform="rotate(30 161 142)" />
        <ellipse cx="172" cy="148" rx="10" ry="4" fill="#44403C" opacity="0.3" stroke="none" />
      </g>
    </svg>
  )
}
