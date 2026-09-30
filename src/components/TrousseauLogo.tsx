import { useId } from 'react'

/** Interlocking platinum + brass bands for Trousseau lockups. */
export function TrousseauMark({
  className,
  title,
  animate = false,
}: {
  className?: string
  title?: string
  /** Gentle independent float on each band (nav / idle). */
  animate?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="4 4 64 50"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      className={`${animate ? 'logo-mark' : ''} ${className ?? ''}`.trim()}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${uid}-silver`} x1="8" y1="6" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#D8E2DC" />
          <stop offset="1" stopColor="#8FA599" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="28" y1="4" x2="64" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8CFA8" />
          <stop offset="0.45" stopColor="#B8956A" />
          <stop offset="1" stopColor="#7E5C35" />
        </linearGradient>
      </defs>
      <g transform="rotate(-12 36 30)">
        <g className={animate ? 'logo-ring logo-ring-silver' : undefined}>
          <path
            fill={`url(#${uid}-silver)`}
            fillRule="evenodd"
            d="M26 30m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0zm18-12.5a12.5 12.5 0 1 1 0 25a12.5 12.5 0 1 1 0-25z"
          />
        </g>
        <g className={animate ? 'logo-ring logo-ring-gold' : undefined}>
          <path
            fill={`url(#${uid}-gold)`}
            fillRule="evenodd"
            d="M46 30m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0zm18-12.5a12.5 12.5 0 1 1 0 25a12.5 12.5 0 1 1 0-25z"
          />
        </g>
      </g>
    </svg>
  )
}

export function TrousseauLogo({
  className,
  markClassName,
  wordClassName,
  onDark = false,
  animateMark = false,
}: {
  className?: string
  markClassName?: string
  wordClassName?: string
  onDark?: boolean
  animateMark?: boolean
}) {
  return (
    <span className={`logo-lockup inline-flex items-center ${className ?? ''}`}>
      <TrousseauMark animate={animateMark} className={markClassName ?? 'h-9 w-auto'} />
      <span
        className={
          wordClassName ??
          `font-[family-name:var(--font-display)] text-[1.75rem] leading-none tracking-[-0.03em] ${
            onDark ? 'text-[var(--on-dark)]' : 'text-[var(--ink)]'
          }`
        }
      >
        Trousseau
      </span>
    </span>
  )
}
