import { useState } from 'react'
import { db, newId } from '../../db/dexie'
import type { InstallmentStub, LineItem } from '../../db/types'
import { sortInstallments } from '../../lib/calendar-dues'
import { dbWrite } from '../../lib/db-write'
import { formatDue } from '../../lib/expense-display'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { showToast } from '../../lib/toast'
import { LineItemField } from './line-item-field'

export function LineItemInstallmentsSection({
  item,
  onChange,
}: {
  item: LineItem
  onChange: (next: InstallmentStub[]) => void
}) {
  const stubs = sortInstallments(item.installments ?? [])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  async function persist(next: InstallmentStub[]) {
    await dbWrite(() => db.lineItems.update(item.id, { installments: next.length ? next : undefined }))
    onChange(next)
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        Installment schedule
      </p>
      <p className="text-sm text-[var(--ink-faint)]">
        Extra dated amounts beyond deposit and remaining balance.
      </p>
      {stubs.length > 0 ? (
        <ul className="divide-y divide-[var(--line-soft)] border border-[var(--line-soft)]">
          {stubs.map((inst) => (
            <li key={inst.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="tabular-nums text-[var(--ink-muted)]">
                {formatDue(inst.date)} · {formatMoney(inst.amount)}
                {inst.note ? ` · ${inst.note}` : ''}
              </span>
              <button
                type="button"
                className="text-[var(--ink-faint)] hover:text-[var(--danger)]"
                onClick={async () => {
                  await persist(stubs.filter((s) => s.id !== inst.id))
                  showToast('Installment removed')
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <LineItemField label="Amount">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field-input"
            placeholder="0"
          />
        </LineItemField>
        <LineItemField label="Due date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field-input" />
        </LineItemField>
        <div className="flex items-end">
          <button
            type="button"
            className="btn-ghost w-full px-3 py-2 text-sm sm:w-auto"
            onClick={async () => {
              const n = parseMoneyInput(amount)
              if (!(n > 0) || !date) {
                showToast('Enter amount and date')
                return
              }
              const next = sortInstallments([
                ...stubs,
                { id: newId('inst'), amount: n, date, note: note.trim() || undefined },
              ])
              await persist(next)
              setAmount('')
              setDate('')
              setNote('')
              showToast('Installment added')
            }}
          >
            Add
          </button>
        </div>
      </div>
      <LineItemField label="Note (optional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="field-input"
          placeholder="Second payment, milestone…"
        />
      </LineItemField>
    </div>
  )
}
