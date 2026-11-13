export function AudioButton({
  onClick,
  speaking,
  label = 'Wort anhören',
  disabled = false,
}: {
  onClick: () => void
  speaking: boolean
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`audio-button${speaking ? ' is-speaking' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
      <span className="audio-button__label">{label}</span>
    </button>
  )
}
