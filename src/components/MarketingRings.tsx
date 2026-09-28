import ringsUrl from '../assets/marketing-rings.png'

/** Photoreal interlocking bands for the marketing hero. */
export function MarketingRings({ className }: { className?: string }) {
  return (
    <img
      src={ringsUrl}
      alt=""
      aria-hidden
      draggable={false}
      className={className}
    />
  )
}
