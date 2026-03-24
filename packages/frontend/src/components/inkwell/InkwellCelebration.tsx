interface Props {
  className?: string
  width?: number
  height?: number
}

export function InkwellCelebration({ className = '', width = 200, height = 220 }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Body mid-jump */}
        <path d="M 68 140 C 65 112, 72 95, 100 92 C 128 89, 135 110, 133 140 C 131 153, 70 154, 68 140 Z" fill="#FAFAF9" />
        {/* Head */}
        <ellipse cx="100" cy="75" rx="29" ry="26" fill="#FAFAF9" transform="rotate(3 100 75)" />
        {/* Ears perked */}
        <path d="M 77 55 L 68 22 L 87 48" fill="#FAFAF9" />
        <path d="M 123 53 L 134 18 L 113 46" fill="#FAFAF9" />
        <path d="M 76 51 L 70 28 L 84 48" stroke="#F97316" strokeWidth="1.5" />
        <path d="M 124 49 L 131 24 L 116 46" stroke="#F97316" strokeWidth="1.5" />
        {/* Ink splatter */}
        <circle cx="100" cy="55" r="5" fill="#44403C" stroke="none" />
        <circle cx="95" cy="52" r="2.5" fill="#44403C" stroke="none" />
        <circle cx="106" cy="53" r="2" fill="#44403C" stroke="none" />
        {/* Happy squinty eyes */}
        <path d="M 80 70 C 84 62, 92 62, 96 70" strokeWidth="3" />
        <path d="M 104 69 C 108 61, 116 61, 120 69" strokeWidth="3" />
        {/* Big smile */}
        <path d="M 86 82 C 90 92, 110 92, 114 82" strokeWidth="2.5" />
        <path d="M 89 84 C 94 90, 106 90, 111 84" fill="white" stroke="none" />
        {/* Blush */}
        <circle cx="78" cy="78" r="6" fill="#F97316" opacity="0.15" stroke="none" />
        <circle cx="122" cy="78" r="6" fill="#F97316" opacity="0.15" stroke="none" />
        {/* Nose */}
        <path d="M 98 76 L 102 76 L 100 79 Z" fill="#F97316" />
        {/* Scarf flying */}
        <path d="M 78 92 C 65 88, 50 82, 40 76" stroke="#A78BFA" strokeWidth="3" />
        <path d="M 40 76 C 32 72, 28 78, 35 82" stroke="#A78BFA" strokeWidth="2.5" />
        <path d="M 122 90 C 135 86, 148 78, 155 72" stroke="#A78BFA" strokeWidth="3" />
        <path d="M 155 72 C 162 68, 168 74, 160 78" stroke="#A78BFA" strokeWidth="2.5" />
        {/* Arms up */}
        <path d="M 75 105 C 58 92, 42 75, 35 58" strokeWidth="2.5" />
        <path d="M 125 105 C 142 92, 158 75, 165 58" strokeWidth="2.5" />
        <circle cx="33" cy="56" r="6" fill="#FAFAF9" />
        <circle cx="167" cy="56" r="6" fill="#FAFAF9" />
        {/* Trophy */}
        <path d="M 158 30 L 160 48 L 176 48 L 178 30 Z" fill="#FBBF24" strokeWidth="2" />
        <rect x="164" y="48" width="8" height="3" rx="1" fill="#D97706" stroke="none" />
        <rect x="162" y="51" width="12" height="3" rx="1" fill="#D97706" stroke="none" />
        <path d="M 158 34 C 152 34, 150 40, 156 42" stroke="#D97706" strokeWidth="1.5" />
        <path d="M 178 34 C 184 34, 186 40, 180 42" stroke="#D97706" strokeWidth="1.5" />
        {/* Stars */}
        <path d="M 30 38 L 32 30 L 34 38 L 40 36 L 35 40 L 38 47 L 32 43 L 26 47 L 29 40 L 23 36 Z" fill="#FBBF24" stroke="none" />
        <path d="M 95 15 L 97 8 L 99 15 L 105 13 L 100 17 L 103 23 L 97 20 L 91 23 L 94 17 L 88 13 Z" fill="#FBBF24" stroke="none" />
        <path d="M 60 28 L 62 23 L 64 28 L 68 27 L 65 30 L 67 34 L 62 32 L 58 34 L 60 30 L 56 27 Z" fill="#FBBF24" stroke="none" opacity="0.6" />
        <path d="M 140 25 L 142 20 L 144 25 L 148 24 L 145 27 L 147 31 L 142 29 L 138 31 L 140 27 L 136 24 Z" fill="#FBBF24" stroke="none" opacity="0.6" />
        {/* Confetti */}
        <rect x="50" y="42" width="6" height="3" rx="1" fill="#0EA5E9" stroke="none" transform="rotate(25 53 43)" />
        <rect x="148" y="40" width="6" height="3" rx="1" fill="#F97316" stroke="none" transform="rotate(-20 151 41)" />
        <rect x="75" y="22" width="5" height="3" rx="1" fill="#22C55E" stroke="none" transform="rotate(40 77 23)" />
        <rect x="125" y="20" width="5" height="3" rx="1" fill="#A78BFA" stroke="none" transform="rotate(-35 127 21)" />
        {/* Legs */}
        <path d="M 80 152 L 70 172" strokeWidth="2.5" />
        <path d="M 120 152 L 130 172" strokeWidth="2.5" />
        <ellipse cx="68" cy="175" rx="9" ry="5" fill="#FAFAF9" />
        <ellipse cx="132" cy="175" rx="9" ry="5" fill="#FAFAF9" />
        {/* Tail with ink tip */}
        <path d="M 133 138 C 150 130, 165 118, 160 100 C 155 88, 168 82, 175 88" strokeWidth="2.5" />
        <circle cx="176" cy="89" r="4" fill="#44403C" stroke="none" />
        <circle cx="172" cy="95" r="1.5" fill="#44403C" opacity="0.3" stroke="none" />
      </g>
    </svg>
  )
}
