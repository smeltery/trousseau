import { useEffect, useState } from 'react'
import { subscribeToasts } from '../lib/toast'

export function ToastHost() {
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 page-pad"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="toast-enter max-w-sm rounded-sm border border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_88%,transparent)] px-4 py-3 text-sm font-medium text-[var(--on-dark)] shadow-[var(--sheet-shadow)] backdrop-blur-xl"
        >
          {toast.message}
        </p>
      ))}
    </div>
  )
}
