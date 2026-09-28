import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/dexie'
import type { LineItem, LineStatus } from '../db/types'
import { STATUS_LABELS } from '../lib/budget'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { parseMoneyInput } from '../lib/money'
import { showToast } from '../lib/toast'
import { useDialogFocus } from '../lib/use-dialog-focus'
import { AttachmentList } from './AttachmentList'

interface LineItemSheetProps {
  lineItemId: string
  onClose: () => void
}

const STATUSES: LineStatus[] = ['planned', 'deposit', 'partial', 'paid']

export function LineItemSheet({ lineItemId, onClose }: LineItemSheetProps) {
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (item === undefined) {
    return (
      <SheetShell titleId={titleId} onClose={onClose} title="Expense">
        <p className="text-[var(--ink-muted)]">Opening…</p>
      </SheetShell>
    )
  }

  if (item === null) {
    return (
      <SheetShell titleId={titleId} onClose={onClose} title="Expense">
        <p className="text-[var(--ink-muted)]">This expense was removed.</p>
      </SheetShell>
    )
  }

  return (
    <SheetShell
      titleId={titleId}
      onClose={onClose}
      title={item.label}
      subtitle={category?.name}
    >
      <LineItemForm key={item.id} item={item} />
      <div className="mt-10 border-t border-[var(--line)] pt-8">
        <AttachmentList lineItemId={item.id} attachments={attachments} />
      </div>
      <div className="mt-10 flex justify-between border-t border-[var(--line)] pt-6">
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
            await dbWrite(() =>
              db.transaction('rw', db.lineItems, db.attachments, async () => {
                await db.attachments.where('lineItemId').equals(item.id).delete()
                await db.lineItems.delete(item.id)
              }),
            )
            showToast('Expense deleted')
            onClose()
          }}
        >
          Delete expense
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
        >
          Done
        </button>
      </div>
    </SheetShell>
  )
}

function SheetShell({
  titleId,
  title,
  subtitle,
  onClose,
  children,
}: {
  titleId: string
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
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
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-[var(--wash)] shadow-[var(--sheet-shadow)] animate-[sheet-in_0.35s_var(--ease-out)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div className="min-w-0">
            {subtitle ? (
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
                {subtitle}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

function LineItemForm({ item }: { item: LineItem }) {
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [paid, setPaid] = useState(String(item.paidAmount))
  const [status, setStatus] = useState(item.status)
  const [dueDate, setDueDate] = useState(item.dueDate ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  return (
    <div className="grid gap-5">
      <Field label="Label">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            const next = label.trim() || item.label
            setLabel(next)
            void persist({ label: next })
          }}
          className="field-input"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Expected amount">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => {
              const n = parseMoneyInput(amount)
              setAmount(String(n))
              void persist({ amount: n })
            }}
            className="field-input"
          />
        </Field>
        <Field label="Paid so far">
          <input
            inputMode="decimal"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            onBlur={() => {
              const n = parseMoneyInput(paid)
              setPaid(String(n))
              const patch: Partial<LineItem> = { paidAmount: n }
              if (n > 0 && status === 'planned') {
                patch.status = n >= parseMoneyInput(amount) && parseMoneyInput(amount) > 0 ? 'paid' : 'partial'
                setStatus(patch.status)
              }
              void persist(patch)
            }}
            className="field-input"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as LineStatus
              setStatus(next)
              void persist({ status: next })
            }}
            className="field-input"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const next = e.target.value
              setDueDate(next)
              void persist({ dueDate: next || undefined })
            }}
            className="field-input"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void persist({ notes: notes.trim() || undefined })}
          className="field-input resize-y"
          placeholder="Vendor contact, confirmation numbers…"
        />
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
