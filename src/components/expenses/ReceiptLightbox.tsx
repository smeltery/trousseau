import { useEffect } from 'react'

/** Full-viewport image preview. Esc / backdrop click closes. */
export function ReceiptLightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Receipt preview'}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,var(--grove)_72%,black)] p-4"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-sm font-semibold text-[var(--on-dark)] underline underline-offset-4"
        onClick={onClose}
      >
        Close
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[min(960px,94vw)] object-contain shadow-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
