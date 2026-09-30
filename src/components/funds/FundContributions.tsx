import { useState } from 'react'
import { db, newId } from '../../db/dexie'
import type { Fund, FundContribution } from '../../db/types'
import { todayKey } from '../../lib/calendar'
import { dbWrite } from '../../lib/db-write'
import { parseMoneyInput } from '../../lib/money'
import { showToast } from '../../lib/toast'

/** Savings contribution list with edit/remove + add. */
export function FundContributions({
  fund,
  onSaved,
  onAmountChange,
}: {
  fund: Fund
  onSaved: () => void
  onAmountChange: (amount: number) => void
}) {
  const contribs = fund.contributions ?? []
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayKey())

  async function writeContribs(next: FundContribution[], amountDelta: number) {
    const nextAmount = Math.round((fund.amount + amountDelta) * 100) / 100
    await dbWrite(() =>
      db.funds.update(fund.id, {
        contributions: next.length ? next : undefined,
        amount: nextAmount,
      }),
    )
    onAmountChange(nextAmount)
    onSaved()
  }

  return (
    <div className="mt-3 grid gap-2">
      {contribs.length > 0 ? (
        <ul className="grid gap-1.5">
          {contribs.map((c) => (
            <ContribRow
              key={c.id}
              contrib={c}
              onSave={async (patch) => {
                const delta = (patch.amount ?? c.amount) - c.amount
                const next = contribs.map((x) => (x.id === c.id ? { ...x, ...patch } : x))
                await writeContribs(next, delta)
                showToast('Contribution updated')
              }}
              onRemove={async () => {
                await writeContribs(
                  contribs.filter((x) => x.id !== c.id),
                  -c.amount,
                )
                showToast('Contribution removed')
              }}
            />
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[6rem]">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
            Add contribution
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="field-input py-1.5 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field-input py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          className="btn-ghost px-2 py-1.5 text-sm"
          onClick={async () => {
            const n = parseMoneyInput(amount)
            if (!(n > 0) || !date) {
              showToast('Enter amount and date')
              return
            }
            await writeContribs([...contribs, { id: newId('fc'), amount: n, date }], n)
            setAmount('')
            showToast('Contribution added')
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ContribRow({
  contrib,
  onSave,
  onRemove,
}: {
  contrib: FundContribution
  onSave: (patch: Partial<Pick<FundContribution, 'amount' | 'date'>>) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [amountText, setAmountText] = useState(String(contrib.amount))
  const [date, setDate] = useState(contrib.date)

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-2 py-1.5 text-xs tabular-nums text-[var(--ink-muted)]">
      <input
        type="date"
        value={date}
        aria-label="Contribution date"
        onChange={(e) => setDate(e.target.value)}
        onBlur={() => {
          if (date && date !== contrib.date) void onSave({ date })
        }}
        className="field-input w-auto py-0.5 text-xs"
      />
      <input
        inputMode="decimal"
        value={amountText}
        aria-label="Contribution amount"
        onChange={(e) => setAmountText(e.target.value)}
        onBlur={() => {
          const n = parseMoneyInput(amountText)
          setAmountText(String(n))
          if (n > 0 && n !== contrib.amount) void onSave({ amount: n })
        }}
        className="field-input w-[5.5rem] py-0.5 text-right text-xs"
      />
      {contrib.note ? <span className="text-[var(--ink-faint)]">· {contrib.note}</span> : null}
      <button
        type="button"
        className="ml-auto text-[var(--ink-faint)] hover:text-[var(--danger)]"
        onClick={() => void onRemove()}
      >
        Remove
      </button>
    </li>
  )
}
