/** Soft confetti burst for successful blank / import / export. No-ops under reduced motion. */
const COLORS = ['#b8956a', '#6f8f7c', '#eef3f0', '#8f6e45', '#cfd9d3', '#a3483c', '#f0d9b5']

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rot: number
  vr: number
  born: number
  life: number
  round: boolean
}

function spawn(
  count: number,
  ox: number,
  oy: number,
  angle: number,
  spread: number,
  born: number,
): Particle[] {
  return Array.from({ length: count }, () => {
    const a = angle + (Math.random() - 0.5) * spread
    const speed = 7 + Math.random() * 14
    return {
      x: ox + (Math.random() - 0.5) * 28,
      y: oy + (Math.random() - 0.5) * 16,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 1.5,
      w: 4 + Math.random() * 8,
      h: 3 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.45,
      born,
      life: 1,
      round: Math.random() < 0.28,
    }
  })
}

export function celebrate(): void {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  } as CSSStyleDeclaration)
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const size = () => {
    canvas.width = Math.floor(window.innerWidth * dpr)
    canvas.height = Math.floor(window.innerHeight * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  size()

  const w = window.innerWidth
  const h = window.innerHeight
  const particles: Particle[] = [
    ...spawn(90, w * 0.5, h * 0.22, -Math.PI / 2, Math.PI * 1.05, 0),
    ...spawn(55, w * 0.08, h * 0.55, -Math.PI / 4, Math.PI * 0.55, 80),
    ...spawn(55, w * 0.92, h * 0.55, (-Math.PI * 3) / 4, Math.PI * 0.55, 80),
    ...spawn(70, w * 0.5, h * 0.18, -Math.PI / 2, Math.PI * 0.9, 220),
  ]

  const t0 = performance.now()
  const duration = 2800
  let raf = 0
  const frame = (now: number) => {
    const elapsed = now - t0
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      const age = elapsed - p.born
      if (age < 0) continue
      p.vy += 0.2
      p.vx *= 0.992
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life = Math.max(0, 1 - age / (duration - p.born))
      if (p.life <= 0) continue
      ctx.save()
      ctx.globalAlpha = p.life
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.round) {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }
      ctx.restore()
    }
    if (elapsed < duration) raf = requestAnimationFrame(frame)
    else canvas.remove()
  }
  raf = requestAnimationFrame(frame)
  window.setTimeout(() => {
    cancelAnimationFrame(raf)
    canvas.remove()
  }, duration + 200)
}
