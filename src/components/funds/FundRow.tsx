import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Category, Fund, LineItem } from '../../db/types'
import { GROUP_LABELS } from '../../lib/budget'
import { askConfirm } from '../../lib/confirm'
import { dbWrite } from '../../lib/db-write'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { swapSort } from '../../lib/reorder'
import { showToast } from '../../lib/toast'
import { cascadeFundIdOnDelete } from '../../lib/ux/fund-drawdown'
import { fundDrawdown } from '../../lib/ux/fund-drawdown'
import { FundContributions } from './FundContributions'
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
  const showGiftMeta = fund.type === 'gift'
  const draw = fundDrawdown(fund, lineItems)

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
            const cleared = await cascadeFundIdOnDelete(fund.id)
            showToast(cleared > 0 ? `Removed · cleared ${cleared} payment link${cleared === 1 ? '' : 's'}` : 'Removed')
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
        <FundContributions
          fund={fund}
          onSaved={flashSaved}
          onAmountChange={(n) => setAmountText(String(n))}
        />
      ) : null}
    </li>
  )
}
