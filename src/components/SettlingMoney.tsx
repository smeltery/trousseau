import { useEffect, useRef, useState } from 'react'
import { formatMoney } from '../lib/money'

interface SettlingMoneyProps {
  value: number
  className?: string
}

/** Tweens currency when the value changes; falls back instantly under reduced motion. */
export function SettlingMoney({ value, className = '' }: SettlingMoneyProps) {
  const [display, setDisplay] = useState(value)
  const [flash, setFlash] = useState(false)
  const displayRef = useRef(value)

  useEffect(() => {
    displayRef.current = display
  }, [display])

  useEffect(() => {
    if (value === displayRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const start = displayRef.current
    const delta = value - start
    const t0 = performance.now()
    const dur = 420
    setFlash(true)
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - (1 - p) ** 3
      setDisplay(start + delta * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        setDisplay(value)
        setFlash(false)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className={`tabular-nums ${flash ? 'money-settle' : ''} ${className}`}>
      {formatMoney(display)}
    </span>
  )
}
