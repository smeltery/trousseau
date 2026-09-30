import type { ReactNode, SVGProps } from 'react'

type SketchProps = SVGProps<SVGSVGElement> & { title?: string }

const base = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function isHidden(props: SketchProps): boolean {
  return props['aria-hidden'] === true || props['aria-hidden'] === 'true'
}

function SketchRoot({
  viewBox,
  title,
  defaultTitle,
  children,
  ...props
}: SketchProps & { viewBox: string; defaultTitle: string; children: ReactNode }) {
  const label = title ?? defaultTitle
  const decorative = isHidden(props)
  return (
    <svg
      viewBox={viewBox}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : label}
      {...props}
    >
      {!decorative && label ? <title>{label}</title> : null}
      {children}
    </svg>
  )
}

/** Interlocking wedding bands with real stroke weight (no gem clipart). */
export function SketchRings({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 120 90" defaultTitle="Wedding rings" title={title} {...props}>
      <ellipse cx="44" cy="50" rx="30" ry="28" {...base} strokeWidth={3.2} />
      <ellipse cx="44" cy="50" rx="18" ry="16" {...base} strokeWidth={1.4} opacity={0.4} />
      <ellipse cx="76" cy="48" rx="30" ry="28" {...base} strokeWidth={3.2} />
      <ellipse cx="76" cy="48" rx="18" ry="16" {...base} strokeWidth={1.4} opacity={0.4} />
    </SketchRoot>
  )
}

/** Bridal bouquet: peonies, roses, eucalyptus, ribbon-wrapped stems. */
export function SketchBouquet({ title, ...props }: SketchProps) {
  const ink = { ...base, strokeWidth: 1.35 }
  const fine = { ...base, strokeWidth: 1.05 }
  return (
    <SketchRoot viewBox="0 0 200 280" defaultTitle="Bridal bouquet" title={title} {...props}>
      {/* Eucalyptus sprays */}
      <g {...ink}>
        <path d="M58 118c-18-28-22-58-8-78" />
        <circle cx="48" cy="52" r="9" />
        <circle cx="38" cy="72" r="8" />
        <circle cx="52" cy="88" r="7.5" />
        <circle cx="34" cy="98" r="6.5" />
        <path d="M148 112c16-26 18-54 4-74" />
        <circle cx="158" cy="48" r="9" />
        <circle cx="168" cy="70" r="8" />
        <circle cx="152" cy="86" r="7.5" />
        <circle cx="170" cy="96" r="6.5" />
        <path d="M96 42c-6-18 2-32 14-38" />
        <circle cx="108" cy="14" r="7" />
        <circle cx="118" cy="28" r="6" />
      </g>

      {/* Left peony */}
      <g {...ink} transform="translate(28 78)">
        <path d="M36 52c-18 2-30-10-28-26 2-14 14-22 28-18 6-12 20-14 30-4 12 10 10 28-2 36 8 10 4 26-10 30-16 4-28-6-18-18z" />
        <path d="M34 40c-8-2-12-10-8-16 6-4 12-2 14 4" {...fine} />
        <path d="M48 36c4-8 14-8 18 0 2 6-2 12-8 12" {...fine} />
        <path d="M40 48c-2 6 2 12 10 12 6 0 10-6 8-12" {...fine} />
        <circle cx="42" cy="42" r="3.5" {...fine} />
      </g>

      {/* Center peony */}
      <g {...ink} transform="translate(68 48)">
        <path d="M42 58c-20 4-36-8-34-28 2-18 18-28 34-22 8-14 26-16 36-2 14 14 10 34-4 42 10 12 4 30-12 34-18 6-32-6-20-24z" />
        <path d="M38 42c-10-4-14-14-8-22 8-6 16-2 18 6" {...fine} />
        <path d="M56 36c6-10 18-10 24 2 4 8-2 16-12 16" {...fine} />
        <path d="M34 54c-4 8 2 16 12 16s14-8 10-16" {...fine} />
        <path d="M58 56c4 10-2 18-12 18s-14-10-8-18" {...fine} />
        <circle cx="48" cy="48" r="5" {...fine} />
        <path d="M44 48c2-4 6-4 8 0" {...fine} />
      </g>

      {/* Right rose */}
      <g {...ink} transform="translate(118 82)">
        <path d="M28 44c-14 0-24-10-22-22 2-12 12-18 24-14 4-10 16-12 24-4 10 8 8 22-2 28 6 8 2 20-10 22-12 4-22-4-14-10z" />
        <path d="M30 30c-6 0-10-6-6-12 6-4 12 0 12 6" {...fine} />
        <path d="M40 28c2-6 10-6 12 0 2 4-2 8-6 8" {...fine} />
        <circle cx="34" cy="34" r="3" {...fine} />
        <path d="M28 34c4-2 8-2 12 0M30 38c4 2 8 2 12 0" {...fine} />
      </g>

      {/* Lower buds + small blooms */}
      <g {...ink}>
        <path d="M64 148c-8-2-12-10-8-16 6-4 12 0 12 8" />
        <path d="M70 140c0-8 6-12 12-10" {...fine} />
        <path d="M132 146c8-2 12-10 8-16-6-4-12 0-12 8" />
        <path d="M126 138c0-8-6-12-12-10" {...fine} />
        <path d="M88 152c-6 0-10-6-6-12 6-4 12 2 10 10" {...fine} />
        <path d="M112 150c6 0 10-6 6-12-6-4-12 2-10 10" {...fine} />
      </g>

      {/* Pointed leaves */}
      <g {...fine}>
        <path d="M54 128c-16 4-28 18-28 28 12-2 24-10 28-22" />
        <path d="M146 126c16 4 28 18 28 28-12-2-24-10-28-22" />
        <path d="M78 136c-10 12-8 28 2 34 4-12 8-22 10-30" />
        <path d="M122 134c10 12 8 28-2 34-4-12-8-22-10-30" />
      </g>

      {/* Stems */}
      <g {...ink}>
        <path d="M92 168c-2 18-4 36-2 54" />
        <path d="M100 170c0 18 0 36 2 54" />
        <path d="M108 168c2 18 4 36 4 54" />
        <path d="M84 160c-4 8-6 18-4 28" {...fine} />
        <path d="M116 158c4 8 6 18 4 28" {...fine} />
      </g>

      {/* Ribbon wrap + bow */}
      <g {...ink}>
        <path d="M78 176h44" strokeWidth={2} />
        <path d="M80 184h40" strokeWidth={1.6} />
        <path d="M82 192h36" strokeWidth={1.4} />
        <path d="M100 176c-18-10-28-4-30 8 4 8 16 8 30-2 14 10 26 10 30 2-2-12-12-18-30-8z" />
        <path d="M70 186c-12 10-14 28-4 36 8 2 14-8 12-18" {...fine} />
        <path d="M130 186c12 10 14 28 4 36-8 2-14-8-12-18" {...fine} />
        <path d="M88 208c-6 14-4 30 4 40" {...fine} />
        <path d="M112 208c6 14 4 30-4 40" {...fine} />
      </g>
    </SketchRoot>
  )
}

/** Hand-drawn envelope / invitation */
export function SketchEnvelope({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 110 80" defaultTitle="Invitation" title={title} {...props}>
      <path d="M8 18h92v48H8z" {...base} />
      <path d="M8 18l46 28 46-28" {...base} />
      <path d="M8 66l32-22" {...base} strokeWidth={1.2} opacity={0.7} />
      <path d="M100 66l-32-22" {...base} strokeWidth={1.2} opacity={0.7} />
      <path d="M42 42h26" {...base} strokeWidth={1.1} opacity={0.45} />
      <path d="M48 48h14" {...base} strokeWidth={1.1} opacity={0.35} />
    </SketchRoot>
  )
}

/** Simple venue / house with arch */
export function SketchVenue({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 110 100" defaultTitle="Venue" title={title} {...props}>
      <path d="M18 88V42l37-26 37 26v46" {...base} />
      <path d="M42 88V58h26v30" {...base} />
      <path d="M48 58c0-8 14-8 14 0" {...base} strokeWidth={1.3} />
      <rect x="26" y="50" width="12" height="12" {...base} strokeWidth={1.3} />
      <rect x="72" y="50" width="12" height="12" {...base} strokeWidth={1.3} />
      <path d="M55 22v-8" {...base} strokeWidth={1.2} />
      <circle cx="55" cy="12" r="3" {...base} strokeWidth={1.2} />
    </SketchRoot>
  )
}

/** Camera for photographer */
export function SketchCamera({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 100 70" defaultTitle="Camera" title={title} {...props}>
      <rect x="10" y="22" width="80" height="40" rx="4" {...base} />
      <path d="M34 22l6-10h20l6 10" {...base} />
      <circle cx="50" cy="42" r="14" {...base} />
      <circle cx="50" cy="42" r="7" {...base} strokeWidth={1.2} />
      <circle cx="78" cy="32" r="3" {...base} strokeWidth={1.2} />
    </SketchRoot>
  )
}

/** Small heart mark */
export function SketchHeart({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 48 44" defaultTitle="Heart" title={title} {...props}>
      <path
        d="M24 40C10 30 4 22 4 14c0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 8-6 16-20 26z"
        {...base}
      />
    </SketchRoot>
  )
}

/** Cake with topper */
export function SketchCake({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 90 100" defaultTitle="Cake" title={title} {...props}>
      <path d="M18 88h54" {...base} />
      <path d="M22 88V68h46v20" {...base} />
      <path d="M28 68V50h34v18" {...base} />
      <path d="M34 50V36h22v14" {...base} />
      <path d="M45 36v-12" {...base} strokeWidth={1.3} />
      <path d="M45 24c-4-6 0-12 0-12s4 6 0 12z" {...base} strokeWidth={1.2} />
      <path d="M26 74h12M40 78h14M58 74h10" {...base} strokeWidth={1.1} opacity={0.5} />
      <path d="M32 56h10M48 60h10" {...base} strokeWidth={1.1} opacity={0.45} />
    </SketchRoot>
  )
}

/** Music note for DJ/Band */
export function SketchMusic({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 70 90" defaultTitle="Music" title={title} {...props}>
      <path d="M28 68V22l28-8v48" {...base} />
      <ellipse cx="22" cy="70" rx="10" ry="8" {...base} />
      <ellipse cx="50" cy="62" rx="10" ry="8" {...base} />
      <path d="M56 18c4 2 8 8 6 14" {...base} strokeWidth={1.2} opacity={0.55} />
    </SketchRoot>
  )
}

/** Soft pencil for rename / edit-in-place */
export function SketchPencil({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 72 72" defaultTitle="Pencil" title={title} {...props}>
      <path d="M48 10l14 14-36 36H12V46z" {...base} />
      <path d="M42 16l14 14" {...base} strokeWidth={1.3} />
      <path d="M18 48l6 6" {...base} strokeWidth={1.2} opacity={0.55} />
      <path d="M14 58l4 4" {...base} strokeWidth={1.1} opacity={0.4} />
    </SketchRoot>
  )
}

/** Simple month grid for due dates */
export function SketchCalendar({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 90 88" defaultTitle="Calendar" title={title} {...props}>
      <rect x="12" y="18" width="66" height="58" rx="4" {...base} />
      <path d="M12 34h66" {...base} />
      <path d="M30 12v14" {...base} strokeWidth={1.4} />
      <path d="M60 12v14" {...base} strokeWidth={1.4} />
      <circle cx="32" cy="48" r="2.2" fill="currentColor" stroke="none" opacity={0.45} />
      <circle cx="45" cy="48" r="2.2" fill="currentColor" stroke="none" opacity={0.45} />
      <circle cx="58" cy="48" r="2.2" fill="currentColor" stroke="none" opacity={0.55} />
      <circle cx="32" cy="60" r="2.2" fill="currentColor" stroke="none" opacity={0.35} />
      <circle cx="45" cy="60" r="2.2" fill="currentColor" stroke="none" opacity={0.55} />
    </SketchRoot>
  )
}

/** Folded archive / zip for backup */
export function SketchArchive({ title, ...props }: SketchProps) {
  return (
    <SketchRoot viewBox="0 0 90 88" defaultTitle="Archive" title={title} {...props}>
      <path d="M16 28h58v48H16z" {...base} />
      <path d="M16 28l8-12h42l8 12" {...base} />
      <path d="M16 40h58" {...base} strokeWidth={1.3} />
      <path d="M38 52h14" {...base} strokeWidth={1.4} />
      <path d="M45 46v18" {...base} strokeWidth={1.3} />
    </SketchRoot>
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
