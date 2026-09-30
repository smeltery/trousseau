import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Category, LineItem, WhoPays } from '../../db/types'
import { GROUP_LABELS } from '../../lib/budget'
import { bulkMarkPaid, bulkSetCategory, bulkSetDueDate, bulkSetWhoPays } from '../../lib/ux/bulk-expenses'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'

export function ExpenseBulkBar({
  selectedItems,
  categories,
  bulkDue,
  onBulkDueChange,
  onClear,
}: {
  selectedItems: LineItem[]
  categories: Category[]
  bulkDue: string
  onBulkDueChange: (next: string) => void
  onClear: () => void
}) {
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkWho, setBulkWho] = useState<WhoPays | '' | 'clear'>('')
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE

  if (selectedItems.length === 0) {
    return (
      <p className="mb-6 text-sm text-[var(--ink-faint)]">
        Select expenses to mark paid, set due, reassign category, or assign who pays.
      </p>
    )
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-4 py-3">
      <p className="text-sm font-semibold tabular-nums">{selectedItems.length} selected</p>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={async () => {
          await bulkMarkPaid(selectedItems)
          onClear()
        }}
      >
        Mark paid
      </button>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-[var(--ink-muted)]">Set due</span>
        <input
          type="date"
          value={bulkDue}
          onChange={(e) => onBulkDueChange(e.target.value)}
          className="field-input py-1.5 text-sm"
        />
      </label>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-sm"
        disabled={!bulkDue}
        onClick={async () => {
          if (!bulkDue) return
          await bulkSetDueDate(selectedItems, bulkDue)
          onClear()
          onBulkDueChange('')
        }}
      >
        Apply due
      </button>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-[var(--ink-muted)]">Category</span>
        <select
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          className="field-input py-1.5 text-sm"
        >
          <option value="">Move to…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {GROUP_LABELS[c.group]} · {c.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-sm"
        disabled={!bulkCategory}
        onClick={async () => {
          if (!bulkCategory) return
          await bulkSetCategory(selectedItems, bulkCategory)
          onClear()
          setBulkCategory('')
        }}
      >
        Apply
      </button>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-[var(--ink-muted)]">Who pays</span>
        <select
          value={bulkWho}
          onChange={(e) => setBulkWho(e.target.value as WhoPays | '' | 'clear')}
          className="field-input py-1.5 text-sm"
        >
          <option value="">Assign…</option>
          <option value="joint">Joint</option>
          <option value="left">{site.brandLeft}</option>
          <option value="right">{site.brandRight}</option>
          <option value="clear">Unset</option>
        </select>
      </label>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-sm"
        disabled={!bulkWho}
        onClick={async () => {
          if (!bulkWho) return
          await bulkSetWhoPays(selectedItems, bulkWho === 'clear' ? undefined : bulkWho)
          onClear()
          setBulkWho('')
        }}
      >
        Apply who
      </button>
      <button type="button" className="link-quiet text-sm" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
