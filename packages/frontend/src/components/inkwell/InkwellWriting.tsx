interface Props {
  className?: string
  width?: number
  height?: number
}

export function InkwellWriting({ className = '', width = 200, height = 220 }: Props) {
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
        <path d="M 65 135 C 62 108, 68 92, 100 90 C 132 88, 138 106, 136 135 C 134 150, 67 151, 65 135 Z" fill="#FAFAF9" />
        {/* Head */}
        <ellipse cx="100" cy="72" rx="30" ry="27" fill="#FAFAF9" transform="rotate(-2 100 72)" />
        {/* Ears */}
        <path d="M 76 50 L 65 20 L 85 42" fill="#FAFAF9" />
        <path d="M 124 48 L 135 18 L 115 40" fill="#FAFAF9" />
        <path d="M 75 46 L 68 26 L 82 42" stroke="#F97316" strokeWidth="1.5" />
        <path d="M 125 44 L 132 24 L 118 40" stroke="#F97316" strokeWidth="1.5" />
        {/* Ink splatter (signature mark) */}
        <circle cx="100" cy="50" r="5" fill="#44403C" stroke="none" />
        <circle cx="95" cy="47" r="2.5" fill="#44403C" stroke="none" />
        <circle cx="106" cy="48" r="2" fill="#44403C" stroke="none" />
        {/* Eyes */}
        <ellipse cx="88" cy="68" rx="8" ry="9" fill="white" />
        <ellipse cx="112" cy="67" rx="8" ry="9" fill="white" />
        <ellipse cx="90" cy="69" rx="4.5" ry="5" fill="#0EA5E9" />
        <ellipse cx="114" cy="68" rx="4.5" ry="5" fill="#0EA5E9" />
        <circle cx="92" cy="67" r="2" fill="white" stroke="none" />
        <circle cx="116" cy="66" r="2" fill="white" stroke="none" />
        {/* Nose */}
        <path d="M 98 76 L 102 76 L 100 80 Z" fill="#F97316" />
        {/* Smile */}
        <path d="M 92 84 C 95 88, 105 88, 108 84" strokeWidth="2" />
        <circle cx="100" cy="88" r="2.5" fill="#F97316" opacity="0.4" stroke="none" />
        {/* Whiskers */}
        <line x1="65" y1="74" x2="80" y2="76" strokeWidth="1.5" />
        <line x1="63" y1="80" x2="79" y2="79" strokeWidth="1.5" />
        <line x1="120" y1="75" x2="136" y2="73" strokeWidth="1.5" />
        <line x1="121" y1="80" x2="138" y2="79" strokeWidth="1.5" />
        {/* Scarf */}
        <path d="M 78 88 C 72 92, 70 98, 74 100" stroke="#A78BFA" strokeWidth="3" />
        <path d="M 122 87 C 128 91, 132 100, 126 105" stroke="#A78BFA" strokeWidth="3" />
        <path d="M 126 105 C 130 115, 128 125, 120 128" stroke="#A78BFA" strokeWidth="2" strokeDasharray="4 3" />
        {/* Arm with quill */}
        <path d="M 75 108 C 62 112, 48 118, 42 130" strokeWidth="2.5" />
        <line x1="36" y1="138" x2="52" y2="110" stroke="#FBBF24" strokeWidth="4" />
        <polygon points="34,140 36,138 38,142" fill="#44403C" stroke="none" />
        <path d="M 48 115 C 42 108, 35 105, 28 108" stroke="#A78BFA" strokeWidth="2" />
        <path d="M 50 112 C 45 104, 38 100, 30 102" stroke="#A78BFA" strokeWidth="1.5" />
        {/* Other arm */}
        <path d="M 125 108 C 138 112, 148 120, 150 130" strokeWidth="2.5" />
        {/* Desk */}
        <line x1="25" y1="148" x2="175" y2="148" strokeWidth="2.5" />
        <line x1="30" y1="148" x2="27" y2="175" strokeWidth="2" />
        <line x1="170" y1="148" x2="173" y2="175" strokeWidth="2" />
        {/* Paper */}
        <rect x="55" y="132" width="35" height="20" rx="2" fill="white" strokeWidth="1.5" />
        <path d="M 59 137 C 62 136, 68 138, 72 137 C 76 136, 80 137, 85 137" strokeWidth="1" opacity="0.4" />
        <path d="M 59 142 C 64 141, 70 143, 78 142" strokeWidth="1" opacity="0.4" />
        <path d="M 59 147 C 62 146, 66 148, 70 147" strokeWidth="1" opacity="0.4" />
        {/* Ink bottle */}
        <rect x="140" y="135" width="14" height="16" rx="2" fill="#44403C" />
        <rect x="143" y="132" width="8" height="5" rx="1" fill="#44403C" />
        <ellipse cx="147" cy="134" rx="5" ry="2" fill="#57534E" stroke="none" />
        {/* Tail with ink tip */}
        <path d="M 136 133 C 155 128, 168 115, 165 100" strokeWidth="2.5" />
        <circle cx="165" cy="98" r="4" fill="#44403C" stroke="none" />
        <circle cx="160" cy="105" r="1.5" fill="#44403C" opacity="0.4" stroke="none" />
        <circle cx="163" cy="110" r="1" fill="#44403C" opacity="0.3" stroke="none" />
      </g>
    </svg>
  )
}
