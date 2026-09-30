import type { LineItem } from '../../db/types'
import { bulkMarkPaid, bulkSetDueDate } from '../../lib/ux/bulk-expenses'

export function ExpenseBulkBar({
  selectedItems,
  bulkDue,
  onBulkDueChange,
  onClear,
}: {
  selectedItems: LineItem[]
  bulkDue: string
  onBulkDueChange: (next: string) => void
  onClear: () => void
}) {
  if (selectedItems.length === 0) {
    return (
      <p className="mb-6 text-sm text-[var(--ink-faint)]">
        Select expenses to mark paid or set a due date in bulk.
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
      <button type="button" className="link-quiet text-sm" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
