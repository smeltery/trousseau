import { useEffect, useId, useRef, useState } from 'react'
import {
  answerChoice,
  answerConfirm,
  subscribeChoice,
  subscribeConfirm,
  type ChoiceRequest,
  type ConfirmRequest,
} from '../lib/confirm'
import { useDialogFocus } from '../lib/use-dialog-focus'

export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const [choice, setChoice] = useState<ChoiceRequest | null>(null)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const active = choice ?? request

  useEffect(() => subscribeConfirm(setRequest), [])
  useEffect(() => subscribeChoice(setChoice), [])
  useDialogFocus(dialogRef, Boolean(active))

  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (choice) answerChoice('cancel')
      else answerConfirm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, choice])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] animate-[fade-in_0.2s_ease] backdrop-blur-[2px]"
        onClick={() => (choice ? answerChoice('cancel') : answerConfirm(false))}
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
          {active.title}
        </h2>
        {active.body ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{active.body}</p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          {choice ? (
            <>
              <button
                type="button"
                className={
                  choice.primaryDanger
                    ? 'btn-primary bg-[var(--danger)] text-[var(--on-dark)]'
                    : 'btn-primary'
                }
                onClick={() => answerChoice('primary')}
              >
                {choice.primaryLabel}
              </button>
              <button
                type="button"
                className={
                  choice.secondaryDanger
                    ? 'btn-ghost border-[var(--danger)] text-[var(--danger)]'
                    : 'btn-ghost'
                }
                onClick={() => answerChoice('secondary')}
              >
                {choice.secondaryLabel}
              </button>
              <button type="button" className="btn-ghost" onClick={() => answerChoice('cancel')}>
                {choice.cancelLabel ?? 'Cancel'}
              </button>
            </>
          ) : request ? (
            <>
              <button
                type="button"
                className={
                  request.danger ? 'btn-primary bg-[var(--danger)] text-[var(--on-dark)]' : 'btn-primary'
                }
                onClick={() => answerConfirm(true)}
              >
                {request.confirmLabel ?? 'Continue'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => answerConfirm(false)}>
                {request.cancelLabel ?? 'Cancel'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
