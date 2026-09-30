import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../db-write'
import { markPaidPatch } from '../expense-display'
import { dismissToast, showToast } from '../toast'

/** Mark paid and offer a short undo window restoring prior status/paidAmount. */
export async function markPaidWithUndo(item: LineItem): Promise<void> {
  const prior = { status: item.status, paidAmount: item.paidAmount }
  const result = await dbWrite(() => db.lineItems.update(item.id, markPaidPatch(item)))
  if (result === undefined) return
  const id = showToast('Marked paid', {
    durationMs: 5600,
    action: {
      label: 'Undo',
      onClick: () => {
        dismissToast(id)
        void dbWrite(() => db.lineItems.update(item.id, prior))
      },
    },
  })
}
