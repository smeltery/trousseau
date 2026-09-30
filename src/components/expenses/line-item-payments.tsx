import { useState } from 'react'
import type { LineItem } from '../../db/types'
import { formatDue } from '../../lib/expense-display'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { showToast } from '../../lib/toast'
import { recordPaymentWithUndo } from '../../lib/ux/record-payment'

export function LineItemPaymentSection({
  item,
  onApplied,
}: {
  item: LineItem
  onApplied: (patch: Partial<LineItem>) => void
}) {
  const [payment, setPayment] = useState('')
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
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {item.status !== 'paid' ? (
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
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              const patch = await recordPaymentWithUndo(item, parseMoneyInput(payment))
              if (!patch) {
                showToast('Enter a payment amount')
                return
              }
              onApplied(patch)
              setPayment('')
            }}
          >
            Add payment
          </button>
        </div>
      ) : null}
    </div>
  )
}
