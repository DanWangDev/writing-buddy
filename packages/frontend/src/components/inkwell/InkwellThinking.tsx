interface Props {
  className?: string
  width?: number
  height?: number
}

export function InkwellThinking({ className = '', width = 200, height = 220 }: Props) {
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
        {/* Body */}
        <path d="M 65 140 C 62 112, 68 96, 100 94 C 132 92, 138 110, 136 140 C 134 153, 67 154, 65 140 Z" fill="#FAFAF9" />
        {/* Head tilted */}
        <ellipse cx="96" cy="76" rx="29" ry="26" fill="#FAFAF9" transform="rotate(-8 96 76)" />
        {/* Ears */}
        <path d="M 73 55 L 62 24 L 83 47" fill="#FAFAF9" />
        <path d="M 118 50 L 125 18 L 107 42" fill="#FAFAF9" />
        <path d="M 72 51 L 64 30 L 80 47" stroke="#F97316" strokeWidth="1.5" />
        <path d="M 119 46 L 123 24 L 110 42" stroke="#F97316" strokeWidth="1.5" />
        {/* Ink splatter */}
        <circle cx="96" cy="55" r="5" fill="#44403C" stroke="none" />
        <circle cx="91" cy="52" r="2.5" fill="#44403C" stroke="none" />
        <circle cx="102" cy="53" r="2" fill="#44403C" stroke="none" />
        {/* One open eye, one squinting */}
        <ellipse cx="85" cy="72" rx="7" ry="8" fill="white" />
        <ellipse cx="86" cy="73" rx="4" ry="4.5" fill="#0EA5E9" />
        <circle cx="88" cy="71" r="1.8" fill="white" stroke="none" />
        <path d="M 102 70 C 106 63, 114 63, 118 70" strokeWidth="2.5" />
        {/* Nose */}
        <path d="M 94 80 L 98 80 L 96 83 Z" fill="#F97316" />
        {/* Hmm mouth */}
        <path d="M 90 88 C 94 90, 100 89, 104 86" strokeWidth="2" />
        {/* Whiskers */}
        <line x1="62" y1="78" x2="77" y2="79" strokeWidth="1.5" />
        <line x1="60" y1="84" x2="76" y2="82" strokeWidth="1.5" />
        <line x1="112" y1="76" x2="128" y2="73" strokeWidth="1.5" />
        <line x1="113" y1="82" x2="130" y2="80" strokeWidth="1.5" />
        {/* Scarf */}
        <path d="M 74 95 C 68 98, 66 104, 70 106" stroke="#A78BFA" strokeWidth="3" />
        <path d="M 118 93 C 124 96, 128 104, 124 108" stroke="#A78BFA" strokeWidth="3" />
        {/* Paw on chin */}
        <path d="M 75 112 C 64 108, 54 100, 52 90" strokeWidth="2.5" />
        <circle cx="50" cy="88" r="6" fill="#FAFAF9" />
        {/* Other arm */}
        <path d="M 125 112 C 136 118, 144 128, 148 138" strokeWidth="2.5" />
        {/* Magical thought bubble */}
        <circle cx="145" cy="42" r="22" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 3" />
        <circle cx="132" cy="62" r="6" stroke="#A78BFA" strokeWidth="1.5" />
        <circle cx="124" cy="72" r="3.5" stroke="#A78BFA" strokeWidth="1" />
        {/* Sparkle in bubble */}
        <path d="M 145 35 L 147 28 L 149 35 L 155 33 L 150 37 L 153 43 L 147 40 L 141 43 L 144 37 L 138 33 Z" fill="#FBBF24" stroke="none" opacity="0.7" />
        {/* Quill behind ear */}
        <line x1="120" y1="30" x2="138" y2="12" stroke="#FBBF24" strokeWidth="3" />
        <path d="M 135 15 C 142 8, 150 8, 152 14" stroke="#A78BFA" strokeWidth="1.5" />
        {/* Tail with ink tip */}
        <path d="M 136 138 C 155 132, 168 118, 162 102" strokeWidth="2.5" />
        <circle cx="161" cy="100" r="4" fill="#44403C" stroke="none" />
      </g>
    </svg>
  )
}
