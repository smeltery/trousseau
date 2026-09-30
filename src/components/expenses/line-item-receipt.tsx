import type { LineItem } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { db } from '../../db/dexie'
import { todayKey } from '../../lib/calendar'
import { showToast } from '../../lib/toast'

export function LineItemReceiptAssist({
  item,
  onApplied,
}: {
  item: LineItem
  onApplied: (patch: Partial<LineItem>) => void
}) {
  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
    onApplied(patch)
  }

  return (
    <div className="rounded-sm border border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_70%,transparent)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        Receipt assist
      </p>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        No OCR — quick fills after you attach a receipt.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm"
          disabled={!(item.amount > 0) || item.status === 'paid'}
          onClick={async () => {
            const patch = { paidAmount: item.amount, status: 'paid' as const }
            await persist(patch)
            showToast('Paid set to expected')
          }}
        >
          Set paid to expected
        </button>
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm"
          onClick={async () => {
            const dueDate = todayKey()
            await persist({ dueDate })
            showToast('Due set to today')
          }}
        >
          Set due to today
        </button>
      </div>
    </div>
  )
}
