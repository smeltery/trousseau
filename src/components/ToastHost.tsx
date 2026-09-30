import { useEffect, useState } from 'react'
import { dismissToast, subscribeToasts } from '../lib/toast'

type ToastRow = {
  id: string
  message: string
  action?: { label: string; onClick: () => void }
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastRow[]>([])

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
          className="toast-enter pointer-events-auto flex max-w-sm items-center gap-3 rounded-sm border border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_88%,transparent)] px-4 py-3 text-sm font-medium text-[var(--on-dark)] shadow-[var(--sheet-shadow)] backdrop-blur-xl"
        >
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action ? (
            <button
              type="button"
              className="shrink-0 font-semibold text-[var(--accent)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark)]"
              onClick={() => {
                toast.action?.onClick()
                dismissToast(toast.id)
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
        </p>
      ))}
    </div>
  )
}
