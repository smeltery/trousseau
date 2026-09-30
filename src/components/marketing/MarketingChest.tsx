import { MarketingArt } from './MarketingArt'

/** Photoreal bridal chest; slow vertical float when motion is allowed. */
export function MarketingChest({ className }: { className?: string }) {
  return <MarketingArt kind="chest" className={className} />
}
