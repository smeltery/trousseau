import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../../db/dexie'
import type { Category, Fund, LineItem } from '../../db/types'
import { GROUP_LABELS } from '../../lib/budget'
import { askConfirm } from '../../lib/confirm'
import { todayKey } from '../../lib/calendar'
import { dbWrite } from '../../lib/db-write'
import { formatDue } from '../../lib/expense-display'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { swapSort } from '../../lib/reorder'
import { showToast } from '../../lib/toast'
import { fundDrawdown } from '../../lib/ux/fund-drawdown'
import { FundGiftMeta } from './FundGiftMeta'

export function FundRow({
  fund,
  index,
  siblings,
  categories: categoriesProp,
  lineItems = [],
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  fund: Fund
  index: number
  siblings: Fund[]
  categories?: Category[]
  lineItems?: LineItem[]
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const liveCategories =
    useLiveQuery(() => db.categories.orderBy('sort').toArray(), []) ?? ([] as Category[])
  const categories = categoriesProp ?? liveCategories

  const [label, setLabel] = useState(fund.label)
  const [amountText, setAmountText] = useState(String(fund.amount))
  const [saved, setSaved] = useState(false)
  const [contribAmount, setContribAmount] = useState('')
  const [contribDate, setContribDate] = useState(todayKey())
  const showGiftMeta = fund.type === 'gift'
  const draw = fundDrawdown(fund, lineItems)
  const contribs = fund.contributions ?? []

  function flashSaved() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 550)
  }

  return (
    <li
      className={`group border-b border-[var(--line-soft)] py-5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] ${
        saved ? 'editable-saved' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {selectMode ? (
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Select ${fund.label}`}
            className="size-4 shrink-0 accent-[var(--grove)]"
            onChange={() => onToggleSelect?.(fund.id)}
          />
        ) : null}
        {!selectMode && siblings.length > 1 ? (
          <span className="flex shrink-0 flex-col">
            <button
              type="button"
              aria-label={`Move ${fund.label} up`}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
              onClick={async () => {
                const prev = siblings[index - 1]
                if (!prev) return
                await dbWrite(() => swapSort('funds', fund.id, prev.id))
              }}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${fund.label} down`}
              disabled={index === siblings.length - 1}
              className="flex h-8 w-8 items-center justify-center text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
              onClick={async () => {
                const next = siblings[index + 1]
                if (!next) return
                await dbWrite(() => swapSort('funds', fund.id, next.id))
              }}
            >
              ↓
            </button>
          </span>
        ) : null}
        <input
          aria-label="Fund name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={async () => {
            const next = label.trim() || fund.label
            setLabel(next)
            if (next !== fund.label) {
              await dbWrite(() => db.funds.update(fund.id, { label: next }))
              flashSaved()
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-xl leading-6 outline-none transition-colors focus:text-[var(--accent-deep)]"
        />
        <input
          aria-label={`${fund.label} amount`}
          inputMode="decimal"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          onBlur={async () => {
            const amount = parseMoneyInput(amountText)
            setAmountText(String(amount))
            if (amount !== fund.amount) {
              await dbWrite(() => db.funds.update(fund.id, { amount }))
              flashSaved()
            }
          }}
          onFocus={(e) => e.target.select()}
          className="w-[120px] shrink-0 bg-transparent text-right font-[family-name:var(--font-display)] text-[28px] leading-[34px] tracking-[-0.02em] outline-none focus:text-[var(--accent-deep)] sm:w-[140px]"
        />
        <button
          type="button"
          aria-label={`Remove ${fund.label}`}
          className="shrink-0 text-sm text-[var(--ink-faint)] hover:text-[var(--danger)]"
          onClick={async () => {
            const ok = await askConfirm({
              title: `Remove “${fund.label}”?`,
              confirmLabel: 'Remove',
              danger: true,
            })
            if (!ok) return
            await dbWrite(() => db.funds.delete(fund.id))
            showToast('Removed')
          }}
        >
          Remove
        </button>
      </div>
      {draw.drawn > 0 || draw.overdrawn ? (
        <p
          className={`mt-1 text-sm tabular-nums ${draw.overdrawn ? 'text-[var(--danger)]' : 'text-[var(--ink-faint)]'}`}
          role="status"
        >
          {formatMoney(draw.drawn)} drawn
          {draw.overdrawn
            ? ` · ${formatMoney(Math.abs(draw.remaining))} overdrawn`
            : ` · ${formatMoney(draw.remaining)} left`}
        </p>
      ) : null}
      {showGiftMeta ? (
        <FundGiftMeta
          fund={fund}
          categories={categories}
          groupLabels={GROUP_LABELS}
          onSaved={flashSaved}
        />
      ) : null}
      {fund.type === 'savings' ? (
        <div className="mt-3 grid gap-2">
          {contribs.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {contribs.map((c) => (
                <li
                  key={c.id}
                  className="rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-2 py-1 text-xs tabular-nums text-[var(--ink-muted)]"
                >
                  {formatDue(c.date)} · {formatMoney(c.amount)}
                  {c.note ? ` · ${c.note}` : ''}
                </li>
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
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
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
                value={contribDate}
                onChange={(e) => setContribDate(e.target.value)}
                className="field-input py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              className="btn-ghost px-2 py-1.5 text-sm"
              onClick={async () => {
                const n = parseMoneyInput(contribAmount)
                if (!(n > 0) || !contribDate) {
                  showToast('Enter amount and date')
                  return
                }
                const next = [
                  ...contribs,
                  { id: newId('fc'), amount: n, date: contribDate },
                ]
                await dbWrite(() =>
                  db.funds.update(fund.id, {
                    contributions: next,
                    amount: Math.round((fund.amount + n) * 100) / 100,
                  }),
                )
                setAmountText(String(Math.round((fund.amount + n) * 100) / 100))
                setContribAmount('')
                flashSaved()
                showToast('Contribution added')
              }}
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
