import archiveUrl from '../../assets/marketing-archive.png'
import calendarUrl from '../../assets/marketing-calendar.png'
import chestUrl from '../../assets/marketing-chest.png'
import envelopeUrl from '../../assets/marketing-envelope.png'
import keyUrl from '../../assets/marketing-key.png'
import nameplateUrl from '../../assets/marketing-nameplate.png'

const arts = {
  archive: archiveUrl,
  calendar: calendarUrl,
  chest: chestUrl,
  envelope: envelopeUrl,
  key: keyUrl,
  nameplate: nameplateUrl,
} as const

export type MarketingArtKind = keyof typeof arts

/** Photoreal section props; slow vertical float when motion is allowed. */
export function MarketingArt({
  kind,
  className,
  delay,
  motion = true,
}: {
  kind: MarketingArtKind
  className?: string
  delay?: string
  motion?: boolean
}) {
  return (
    <img
      src={arts[kind]}
      alt=""
      aria-hidden
      draggable={false}
      className={`marketing-art-img will-change-transform ${motion ? 'float-soft' : ''} ${className ?? ''}`.trim()}
      style={delay ? { animationDelay: delay } : undefined}
    />
  )
}
