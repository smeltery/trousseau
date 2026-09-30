import { useState } from 'react'
import { db } from '../../db/dexie'
import type { Fund } from '../../db/types'
import { askConfirm } from '../../lib/confirm'
import { dbWrite } from '../../lib/db-write'
import { parseMoneyInput } from '../../lib/money'
import { swapSort } from '../../lib/reorder'
import { showToast } from '../../lib/toast'

export function FundRow({
  fund,
  index,
  siblings,
}: {
  fund: Fund
  index: number
  siblings: Fund[]
}) {
  const [label, setLabel] = useState(fund.label)
  const [amountText, setAmountText] = useState(String(fund.amount))
  const [source, setSource] = useState(fund.source ?? '')
  const [receivedDate, setReceivedDate] = useState(fund.receivedDate ?? '')
  const [thanked, setThanked] = useState(Boolean(fund.thanked))
  const [saved, setSaved] = useState(false)
  const showGiftMeta = fund.type === 'gift'

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
        {siblings.length > 1 ? (
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
      {showGiftMeta ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 pl-0 text-sm text-[var(--ink-muted)] sm:pl-10">
          <label className="flex min-w-[10rem] flex-1 items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
              From
            </span>
            <input
              aria-label={`${fund.label} from`}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onBlur={async () => {
                const next = source.trim()
                setSource(next)
                if (next !== (fund.source ?? '')) {
                  await dbWrite(() =>
                    db.funds.update(fund.id, { source: next || undefined }),
                  )
                  flashSaved()
                }
              }}
              placeholder="Who gave this"
              className="min-w-0 flex-1 border-b border-transparent bg-transparent outline-none focus:border-[var(--line)]"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
              Received
            </span>
            <input
              type="date"
              aria-label={`${fund.label} received date`}
              value={receivedDate}
              onChange={async (e) => {
                const next = e.target.value
                setReceivedDate(next)
                await dbWrite(() =>
                  db.funds.update(fund.id, { receivedDate: next || undefined }),
                )
                flashSaved()
              }}
              className="bg-transparent outline-none"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={thanked}
              aria-label={`${fund.label} thanked`}
              className="size-4 accent-[var(--grove)]"
              onChange={async (e) => {
                const next = e.target.checked
                setThanked(next)
                await dbWrite(() => db.funds.update(fund.id, { thanked: next || undefined }))
                flashSaved()
              }}
            />
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
              Thanked
            </span>
          </label>
        </div>
      ) : null}
    </li>
  )
}
