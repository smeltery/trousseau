import { useEffect, useId, useRef, useState } from 'react'
import { answerConfirm, subscribeConfirm, type ConfirmRequest } from '../lib/confirm'
import { useDialogFocus } from '../lib/use-dialog-focus'

export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => subscribeConfirm(setRequest), [])
  useDialogFocus(dialogRef, Boolean(request))

  useEffect(() => {
    if (!request) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') answerConfirm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request])

  if (!request) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] animate-[fade-in_0.2s_ease] backdrop-blur-[2px]"
        onClick={() => answerConfirm(false)}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-[var(--wash)] p-7 text-[var(--ink)] shadow-[var(--sheet-shadow)] animate-[sheet-in_0.3s_var(--ease-out)] sm:rounded-2xl"
      >
        <h2
          id={titleId}
          className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight"
        >
          {request.title}
        </h2>
        {request.body ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{request.body}</p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            className={request.danger ? 'btn-primary bg-[var(--danger)] text-[var(--on-dark)]' : 'btn-primary'}
            onClick={() => answerConfirm(true)}
          >
            {request.confirmLabel ?? 'Continue'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => answerConfirm(false)}>
            {request.cancelLabel ?? 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
