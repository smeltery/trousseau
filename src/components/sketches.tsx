import type { SVGProps } from 'react'

type SketchProps = SVGProps<SVGSVGElement> & { title?: string }

const base = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Interlocking wedding bands with real stroke weight (no gem clipart). */
export function SketchRings({ title = 'Wedding rings', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 120 90" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <ellipse cx="44" cy="50" rx="30" ry="28" {...base} strokeWidth={3.2} />
      <ellipse cx="44" cy="50" rx="18" ry="16" {...base} strokeWidth={1.4} opacity={0.4} />
      <ellipse cx="76" cy="48" rx="30" ry="28" {...base} strokeWidth={3.2} />
      <ellipse cx="76" cy="48" rx="18" ry="16" {...base} strokeWidth={1.4} opacity={0.4} />
    </svg>
  )
}

/** Loose bouquet / leafy spray */
export function SketchBouquet({ title = 'Bouquet', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 100 110" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path d="M50 98c-1-18 2-34 1-48" {...base} />
      <path d="M50 70c-10 4-18 14-20 24" {...base} strokeWidth={1.3} />
      <path d="M50 68c10 5 17 14 19 25" {...base} strokeWidth={1.3} />
      <ellipse cx="38" cy="42" rx="14" ry="16" {...base} transform="rotate(-18 38 42)" />
      <ellipse cx="62" cy="40" rx="13" ry="15" {...base} transform="rotate(16 62 40)" />
      <ellipse cx="50" cy="28" rx="12" ry="14" {...base} />
      <path d="M50 28c-3-8-1-16 2-18" {...base} strokeWidth={1.2} />
      <path d="M32 50c-8 2-14 0-18-4" {...base} strokeWidth={1.2} />
      <path d="M68 48c8 1 14-1 18-6" {...base} strokeWidth={1.2} />
      <circle cx="44" cy="36" r="2" fill="currentColor" stroke="none" opacity={0.35} />
      <circle cx="56" cy="33" r="1.8" fill="currentColor" stroke="none" opacity={0.35} />
      <circle cx="50" cy="44" r="2.2" fill="currentColor" stroke="none" opacity={0.3} />
    </svg>
  )
}

/** Hand-drawn envelope / invitation */
export function SketchEnvelope({ title = 'Invitation', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 110 80" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path d="M8 18h92v48H8z" {...base} />
      <path d="M8 18l46 28 46-28" {...base} />
      <path d="M8 66l32-22" {...base} strokeWidth={1.2} opacity={0.7} />
      <path d="M100 66l-32-22" {...base} strokeWidth={1.2} opacity={0.7} />
      <path d="M42 42h26" {...base} strokeWidth={1.1} opacity={0.45} />
      <path d="M48 48h14" {...base} strokeWidth={1.1} opacity={0.35} />
    </svg>
  )
}

/** Simple venue / house with arch */
export function SketchVenue({ title = 'Venue', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 110 100" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path d="M18 88V42l37-26 37 26v46" {...base} />
      <path d="M42 88V58h26v30" {...base} />
      <path d="M48 58c0-8 14-8 14 0" {...base} strokeWidth={1.3} />
      <rect x="26" y="50" width="12" height="12" {...base} strokeWidth={1.3} />
      <rect x="72" y="50" width="12" height="12" {...base} strokeWidth={1.3} />
      <path d="M55 22v-8" {...base} strokeWidth={1.2} />
      <circle cx="55" cy="12" r="3" {...base} strokeWidth={1.2} />
    </svg>
  )
}

/** Camera for photographer */
export function SketchCamera({ title = 'Camera', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 100 70" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <rect x="10" y="22" width="80" height="40" rx="4" {...base} />
      <path d="M34 22l6-10h20l6 10" {...base} />
      <circle cx="50" cy="42" r="14" {...base} />
      <circle cx="50" cy="42" r="7" {...base} strokeWidth={1.2} />
      <circle cx="78" cy="32" r="3" {...base} strokeWidth={1.2} />
    </svg>
  )
}

/** Small heart mark */
export function SketchHeart({ title = 'Heart', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 48 44" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path
        d="M24 40C10 30 4 22 4 14c0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 8-6 16-20 26z"
        {...base}
      />
    </svg>
  )
}

/** Cake with topper */
export function SketchCake({ title = 'Cake', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 90 100" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path d="M18 88h54" {...base} />
      <path d="M22 88V68h46v20" {...base} />
      <path d="M28 68V50h34v18" {...base} />
      <path d="M34 50V36h22v14" {...base} />
      <path d="M45 36v-12" {...base} strokeWidth={1.3} />
      <path d="M45 24c-4-6 0-12 0-12s4 6 0 12z" {...base} strokeWidth={1.2} />
      <path d="M26 74h12M40 78h14M58 74h10" {...base} strokeWidth={1.1} opacity={0.5} />
      <path d="M32 56h10M48 60h10" {...base} strokeWidth={1.1} opacity={0.45} />
    </svg>
  )
}

/** Music note for DJ/Band */
export function SketchMusic({ title = 'Music', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 70 90" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <path d="M28 68V22l28-8v48" {...base} />
      <ellipse cx="22" cy="70" rx="10" ry="8" {...base} />
      <ellipse cx="50" cy="62" rx="10" ry="8" {...base} />
      <path d="M56 18c4 2 8 8 6 14" {...base} strokeWidth={1.2} opacity={0.55} />
    </svg>
  )
}

/** Decorative divider with tiny flourishes */
export function SketchDivider({ title = '', ...props }: SketchProps) {
  return (
    <svg viewBox="0 0 200 24" role="presentation" aria-hidden {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M10 12h70" {...base} strokeWidth={1.2} opacity={0.45} />
      <path d="M120 12h70" {...base} strokeWidth={1.2} opacity={0.45} />
      <path
        d="M100 12c-4-6 0-10 0-10s4 4 0 10c4 6 0 10 0 10s-4-4 0-10z"
        {...base}
        strokeWidth={1.3}
      />
    </svg>
  )
}
