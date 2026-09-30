import { useState } from 'react'
import type { LineItem } from '../../db/types'
import { formatDue } from '../../lib/expense-display'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { showToast } from '../../lib/toast'
import { recordPaymentWithUndo } from '../../lib/ux/record-payment'

const METHODS = ['', 'Cash', 'Check', 'Card', 'Transfer', 'Other'] as const

export function LineItemPaymentSection({
  item,
  onApplied,
}: {
  item: LineItem
  onApplied: (patch: Partial<LineItem>) => void
}) {
  const [payment, setPayment] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const stubs = item.payments ?? []

  return (
    <div className="grid gap-3">
      {stubs.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
            Payment history
          </p>
          <div className="flex flex-wrap gap-2">
            {stubs.map((p) => (
              <span
                key={p.id}
                className="rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-2 py-1 text-xs tabular-nums text-[var(--ink-muted)]"
              >
                {formatDue(p.date)} · {formatMoney(p.amount)}
                {p.method ? ` · ${p.method}` : ''}
                {p.note ? ` · ${p.note}` : ''}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {item.status !== 'paid' ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[8rem] flex-1">
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                Record payment
              </span>
              <input
                inputMode="decimal"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="Amount"
                className="field-input"
              />
            </label>
            <label className="min-w-[7rem]">
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                Method
              </span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="field-input"
              >
                {METHODS.map((m) => (
                  <option key={m || 'none'} value={m}>
                    {m || '—'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Note
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Check #, confirmation…"
              className="field-input"
            />
          </label>
          <button
            type="button"
            className="btn-ghost self-start"
            onClick={async () => {
              const patch = await recordPaymentWithUndo(item, parseMoneyInput(payment), {
                method: method || undefined,
                note: note.trim() || undefined,
              })
              if (!patch) {
                showToast('Enter a payment amount')
                return
              }
              onApplied(patch)
              setPayment('')
              setMethod('')
              setNote('')
            }}
          >
            Add payment
          </button>
        </div>
      ) : null}
    </div>
  )
}
