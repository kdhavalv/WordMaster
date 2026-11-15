type MascotMood = 'happy' | 'listen' | 'cheer'

export function Mascot({
  mood = 'happy',
  className = '',
}: {
  mood?: MascotMood
  className?: string
}) {
  const armsUp = mood === 'cheer'

  return (
    <svg
      className={`mascot mascot--${mood}${className ? ` ${className}` : ''}`}
      viewBox="0 0 240 260"
      aria-hidden="true"
      focusable="false"
    >
      {mood === 'listen' && (
        <g className="mascot__sound" fill="none" stroke="#2563eb" strokeLinecap="round">
          <path d="M178 92c12 10 19 24 19 40s-7 30-19 40" strokeWidth="6" opacity="0.8" />
          <path d="M194 78c17 14 27 33 27 54s-10 40-27 54" strokeWidth="4" opacity="0.45" />
        </g>
      )}

      {mood === 'cheer' && (
        <g className="mascot__confetti">
          <circle cx="44" cy="54" r="5" fill="#f97316" />
          <circle cx="190" cy="48" r="4" fill="#10b981" />
          <circle cx="208" cy="112" r="5" fill="#ec4899" />
          <rect x="34" y="118" width="8" height="8" rx="2" fill="#2563eb" transform="rotate(18 38 122)" />
          <rect x="196" y="162" width="7" height="7" rx="2" fill="#f59e0b" transform="rotate(-22 199 165)" />
          <path d="M58 176l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fbbf24" />
          <path d="M188 202l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#60a5fa" />
        </g>
      )}

      {mood !== 'cheer' && (
        <g className="mascot__sparkles">
          <path d="M52 80l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fbbf24" />
          <path d="M194 196l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#60a5fa" />
        </g>
      )}

      <ellipse cx="120" cy="246" rx="62" ry="10" fill="#14213a" opacity="0.14" />

      <g className="mascot__character">
        <path
          className="mascot__arm mascot__arm--left"
          d={armsUp ? 'M88 128c-22-8-37-24-43-46' : 'M88 148c-22-2-38-16-43-36'}
          fill="none"
          stroke="#f5ae1f"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle
          className="mascot__hand mascot__hand--left"
          cx={armsUp ? 44 : 43}
          cy={armsUp ? 76 : 107}
          r="9"
          fill="#ffd966"
          stroke="#9a5a00"
          strokeWidth="3"
        />

        <path
          className="mascot__arm mascot__arm--right"
          d={armsUp ? 'M152 128c22-8 37-24 43-46' : 'M152 148c22-2 38-16 43-36'}
          fill="none"
          stroke="#f5ae1f"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle
          className="mascot__hand mascot__hand--right"
          cx={armsUp ? 196 : 197}
          cy={armsUp ? 76 : 107}
          r="9"
          fill="#ffd966"
          stroke="#9a5a00"
          strokeWidth="3"
        />

        <path
          d="M86 206h68l-34 42z"
          fill="#f6d7a7"
          stroke="#9a5a00"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path d="M107 232h26l-13 16z" fill="#374151" />

        <rect
          x="86"
          y="76"
          width="68"
          height="134"
          rx="23"
          fill="#ffc93c"
          stroke="#9a5a00"
          strokeWidth="3"
        />
        <path d="M86 99v88c0 13 10 23 23 23h5V76H109c-13 0-23 10-23 23z" fill="#ffdf7e" opacity="0.7" />
        <path d="M137 76h-5c-13 0-23 10-23 23v111h5c13 0 23-10 23-23z" fill="#f5ae1f" opacity="0.35" />

        <path
          d="M98 112c4-5 10-7 16-5M126 107c6-2 12 0 16 5"
          fill="none"
          stroke="#8a4b00"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle cx="105" cy="120" r="12" fill="#ffffff" />
        <circle cx="135" cy="120" r="12" fill="#ffffff" />
        <circle cx="107" cy="122" r="6" fill="#14213a" />
        <circle cx="133" cy="122" r="6" fill="#14213a" />
        <circle cx="109" cy="120" r="2" fill="#ffffff" />
        <circle cx="135" cy="120" r="2" fill="#ffffff" />
        <circle cx="94" cy="140" r="7" fill="#f9a8c0" opacity="0.8" />
        <circle cx="146" cy="140" r="7" fill="#f9a8c0" opacity="0.8" />

        {mood === 'cheer' ? (
          <g>
            <path d="M103 139c4 15 30 15 34 0z" fill="#7c2d12" />
            <path d="M112 147c5 4 11 4 16 0z" fill="#fb7185" />
          </g>
        ) : (
          <path
            d="M105 141c4 9 26 9 30 0"
            fill="none"
            stroke="#8a4b00"
            strokeLinecap="round"
            strokeWidth="4"
          />
        )}

        <g className="mascot__hat">
          <path
            d="M93 66 120 5l27 61z"
            fill="#3b82f6"
            stroke="#14213a"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path d="M102 48h36l5 12h-46z" fill="#ffc93c" />
          <path
            d="M120 18l3 7 8 1-6 6 1.5 8-6.5-3.5L113.5 40l1.5-8-6-6 8-1z"
            fill="#fff7d6"
          />
          <rect
            x="76"
            y="60"
            width="88"
            height="14"
            rx="7"
            fill="#2563eb"
            stroke="#14213a"
            strokeWidth="3"
          />
        </g>
      </g>
    </svg>
  )
}
