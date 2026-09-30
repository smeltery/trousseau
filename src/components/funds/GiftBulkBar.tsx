import type { Fund } from '../../db/types'
import { bulkThank } from '../../lib/ux/bulk-funds'

export function GiftBulkBar({
  selectedFunds,
  onClear,
}: {
  selectedFunds: Fund[]
  onClear: () => void
}) {
  if (selectedFunds.length === 0) {
    return (
      <p className="mb-6 text-sm text-[var(--ink-faint)]">
        Select gifts to mark thanked.
      </p>
    )
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-4 py-3">
      <p className="text-sm font-semibold tabular-nums">{selectedFunds.length} selected</p>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={async () => {
          await bulkThank(selectedFunds)
          onClear()
        }}
      >
        Mark thanked
      </button>
      <button type="button" className="link-quiet text-sm" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
