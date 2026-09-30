import { useEffect, useState } from 'react'

/** Client-side QR for a share URL (not rotate / regenerate). */
export function ShareQr({ url, size = 144 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const QR = await import('qrcode')
        const dataUrl = await QR.toDataURL(url, {
          width: size,
          margin: 1,
          color: { dark: '#1a1a1a', light: '#00000000' },
        })
        if (!cancelled) setSrc(dataUrl)
      } catch {
        if (!cancelled) setSrc(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url, size])

  if (!src) return null
  return (
    <img
      src={src}
      alt="Share link QR"
      width={size}
      height={size}
      className="rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] p-2"
    />
  )
}
