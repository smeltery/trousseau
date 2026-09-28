import { useEffect, useRef } from 'react'
import ringsUrl from '../assets/marketing-rings.png'

/** Photoreal interlocking bands; tiny scroll parallax when motion is allowed. */
export function MarketingRings({ className }: { className?: string }) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    function onScroll() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (!el) return
        el.style.transform = `translate3d(0, ${window.scrollY * 0.05}px, 0)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <img
      ref={ref}
      src={ringsUrl}
      alt=""
      aria-hidden
      draggable={false}
      className={`${className ?? ''} will-change-transform`}
    />
  )
}
