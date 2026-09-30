import { useState } from 'react'
import { db } from '../../db/dexie'
import type { Category, CategoryGroup, Fund } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { formatMoney } from '../../lib/money'

export function FundGiftMeta({
  fund,
  categories,
  groupLabels,
  onSaved,
}: {
  fund: Fund
  categories: Category[]
  groupLabels: Record<CategoryGroup, string>
  onSaved: () => void
}) {
  const [source, setSource] = useState(fund.source ?? '')
  const [receivedDate, setReceivedDate] = useState(fund.receivedDate ?? '')
  const [thanked, setThanked] = useState(Boolean(fund.thanked))
  const [earmarkCategoryId, setEarmarkCategoryId] = useState(fund.earmarkCategoryId ?? '')

  const earmarked = categories.find((c) => c.id === earmarkCategoryId)

  return (
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
              await dbWrite(() => db.funds.update(fund.id, { source: next || undefined }))
              onSaved()
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
            await dbWrite(() => db.funds.update(fund.id, { receivedDate: next || undefined }))
            onSaved()
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
            onSaved()
          }}
        />
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
          Thanked
        </span>
      </label>
      <label className="flex min-w-[11rem] items-center gap-2">
        <span className="shrink-0 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
          Earmark
        </span>
        <select
          aria-label={`${fund.label} earmark category`}
          value={earmarkCategoryId}
          onChange={async (e) => {
            const next = e.target.value
            setEarmarkCategoryId(next)
            await dbWrite(() =>
              db.funds.update(fund.id, { earmarkCategoryId: next || undefined }),
            )
            onSaved()
          }}
          className="field-input min-w-0 flex-1 py-1 text-sm"
        >
          <option value="">Earmark…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {groupLabels[c.group]} · {c.name}
            </option>
          ))}
        </select>
      </label>
      {earmarked ? (
        <p className="text-[11px] tracking-[0.04em] text-[var(--ink-faint)]">
          Covers {earmarked.name}
          {fund.amount > 0 ? ` · ${formatMoney(fund.amount)}` : ''}
        </p>
      ) : null}
    </div>
  )
}
