import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { LineItem, PaymentStub } from '../../db/types'
import { askConfirm } from '../../lib/confirm'
import { dbWrite } from '../../lib/db-write'
import {
  formatDue,
  removePaymentPatch,
  updatePaymentPatch,
} from '../../lib/expense-display'
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
  const funds = useLiveQuery(() => db.funds.orderBy('sort').toArray(), []) ?? []
  const [payment, setPayment] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [fundId, setFundId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const stubs = item.payments ?? []
  const fundLabel = (id: string | undefined) =>
    id ? funds.find((f) => f.id === id)?.label : undefined

  async function applyPatch(patch: Partial<LineItem> | null, toast: string) {
    if (!patch) return
    await dbWrite(() => db.lineItems.update(item.id, patch))
    onApplied(patch)
    showToast(toast)
  }

  function startEdit(p: PaymentStub) {
    setEditingId(p.id)
    setEditAmount(String(p.amount))
    setEditDate(p.date)
  }

  return (
    <div className="grid gap-3">
      {stubs.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
            Payment history
          </p>
          <ul className="divide-y divide-[var(--line-soft)] border border-[var(--line-soft)]">
            {stubs.map((p) => (
              <li key={p.id} className="px-3 py-2 text-sm">
                {editingId === p.id ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[6rem] flex-1">
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
                        Amount
                      </span>
                      <input
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="field-input py-1.5 text-sm"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
                        Date
                      </span>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="field-input py-1.5 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-sm"
                      onClick={async () => {
                        const patch = updatePaymentPatch(item, p.id, {
                          amount: parseMoneyInput(editAmount),
                          date: editDate || p.date,
                        })
                        if (!patch) {
                          showToast('Enter a valid amount')
                          return
                        }
                        await applyPatch(patch, 'Payment updated')
                        setEditingId(null)
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-sm text-[var(--ink-faint)] hover:underline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tabular-nums text-[var(--ink-muted)]">
                      {formatDue(p.date)} · {formatMoney(p.amount)}
                      {p.method ? ` · ${p.method}` : ''}
                      {fundLabel(p.fundId) ? ` · from ${fundLabel(p.fundId)}` : ''}
                      {p.note ? ` · ${p.note}` : ''}
                    </span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--accent-deep)] hover:underline"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]"
                        onClick={async () => {
                          const ok = await askConfirm({
                            title: 'Remove this payment?',
                            body: 'Paid amount will be recomputed from remaining stubs.',
                            confirmLabel: 'Remove',
                            danger: true,
                          })
                          if (!ok) return
                          await applyPatch(removePaymentPatch(item, p.id), 'Payment removed')
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
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
          {funds.length > 0 ? (
            <label>
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                Paid from
              </span>
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="field-input"
              >
                <option value="">—</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.type})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
                fundId: fundId || undefined,
              })
              if (!patch) {
                showToast('Enter a payment amount')
                return
              }
              onApplied(patch)
              setPayment('')
              setMethod('')
              setNote('')
              setFundId('')
            }}
          >
            Add payment
          </button>
        </div>
      ) : null}
    </div>
  )
}
