import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/dexie'
import { askConfirm } from '../lib/confirm'
import { canMarkPaid } from '../lib/expense-display'
import { deleteExpenseWithUndo } from '../lib/ux/delete-expense'
import { markPaidWithUndo } from '../lib/ux/mark-paid'
import { duplicateExpense } from '../lib/ux/duplicate-expense'
import { useDialogFocus } from '../lib/use-dialog-focus'
import { AttachmentList } from './AttachmentList'
import { LineItemForm } from './expenses/LineItemForm'

interface LineItemSheetProps {
  lineItemId: string
  siblingIds?: string[]
  onClose: () => void
  onOpenItem?: (id: string) => void
}

export function LineItemSheet({
  lineItemId,
  siblingIds = [],
  onClose,
  onOpenItem,
}: LineItemSheetProps) {
  const titleId = useId()
  const item = useLiveQuery(async () => {
    const row = await db.lineItems.get(lineItemId)
    return row ?? null
  }, [lineItemId])
  const category = useLiveQuery(
    () => (item ? db.categories.get(item.categoryId) : undefined),
    [item?.categoryId],
  )
  const attachments =
    useLiveQuery(() => db.attachments.where('lineItemId').equals(lineItemId).toArray(), [
      lineItemId,
    ]) ?? []

  const idx = siblingIds.indexOf(lineItemId)
  const prevId = idx > 0 ? siblingIds[idx - 1] : undefined
  const nextId = idx >= 0 && idx < siblingIds.length - 1 ? siblingIds[idx + 1] : undefined

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === 'ArrowLeft' && prevId && onOpenItem) {
        e.preventDefault()
        onOpenItem(prevId)
      }
      if (e.key === 'ArrowRight' && nextId && onOpenItem) {
        e.preventDefault()
        onOpenItem(nextId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onOpenItem, prevId, nextId])

  if (item === undefined) {
    return (
      <SheetShell titleId={titleId} onClose={onClose} title="Expense" prevId={prevId} nextId={nextId} onOpenItem={onOpenItem}>
        <p className="text-[var(--ink-muted)]">Opening…</p>
      </SheetShell>
    )
  }
  if (item === null) {
    return (
      <SheetShell titleId={titleId} onClose={onClose} title="Expense" prevId={prevId} nextId={nextId} onOpenItem={onOpenItem}>
        <p className="text-[var(--ink-muted)]">This expense was removed.</p>
      </SheetShell>
    )
  }

  const footer = (
    <>
      <button
        type="button"
        className="text-sm text-[var(--danger)] hover:underline"
        onClick={async () => {
          const ok = await askConfirm({
            title: `Delete “${item.label}”?`,
            body: 'Attachments on this line will be removed too.',
            confirmLabel: 'Delete',
            danger: true,
          })
          if (!ok) return
          await deleteExpenseWithUndo(item)
          onClose()
        }}
      >
        Delete expense
      </button>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            const id = await duplicateExpense(item)
            if (!id) return
            onOpenItem?.(id)
          }}
        >
          Duplicate
        </button>
        {canMarkPaid(item) ? (
          <button type="button" className="btn-ghost" onClick={() => void markPaidWithUndo(item)}>
            Mark paid
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="btn-primary">
          Done
        </button>
      </div>
    </>
  )

  return (
    <SheetShell
      titleId={titleId}
      onClose={onClose}
      title={item.label}
      subtitle={category?.name}
      footer={footer}
      prevId={prevId}
      nextId={nextId}
      onOpenItem={onOpenItem}
    >
      <LineItemForm key={item.id} item={item} />
      <div className="mt-10 border-t border-[var(--line)] pt-8">
        <AttachmentList lineItemId={item.id} attachments={attachments} />
      </div>
    </SheetShell>
  )
}

function SheetShell({
  titleId,
  title,
  subtitle,
  onClose,
  footer,
  children,
  prevId,
  nextId,
  onOpenItem,
}: {
  titleId: string
  title: string
  subtitle?: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
  prevId?: string
  nextId?: string
  onOpenItem?: (id: string) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_40%,transparent)] animate-[fade-in_0.25s_ease]"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-t-2xl bg-[var(--wash)] shadow-[var(--sheet-shadow)] animate-[sheet-in_0.35s_var(--ease-out)] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="min-w-0">
            {subtitle ? (
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
                {subtitle}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="truncate font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight"
            >
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onOpenItem && (prevId || nextId) ? (
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous expense"
                  disabled={!prevId}
                  className="btn-ghost px-2 py-1 text-sm disabled:opacity-30"
                  onClick={() => prevId && onOpenItem(prevId)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next expense"
                  disabled={!nextId}
                  className="btn-ghost px-2 py-1 text-sm disabled:opacity-30"
                  onClick={() => nextId && onOpenItem(nextId)}
                >
                  ›
                </button>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Close
            </button>
          </div>
        </div>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--wash)] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
