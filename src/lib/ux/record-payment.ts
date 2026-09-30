import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../db-write'
import { recordPaymentPatch } from '../expense-display'
import { dismissToast, showToast } from '../toast'

/** Record a payment and offer undo restoring prior status/paidAmount/payments. */
export async function recordPaymentWithUndo(
  item: LineItem,
  payment: number,
  meta?: { note?: string; method?: string },
): Promise<Partial<LineItem> | null> {
  const patch = recordPaymentPatch(item, payment, meta)
  if (!patch) return null
  const prior = {
    status: item.status,
    paidAmount: item.paidAmount,
    payments: item.payments,
  }
  const result = await dbWrite(() => db.lineItems.update(item.id, patch))
  if (result === undefined) return null
  const id = showToast(patch.status === 'paid' ? 'Marked paid' : 'Payment recorded', {
    durationMs: 5600,
    action: {
      label: 'Undo',
      onClick: () => {
        dismissToast(id)
        void dbWrite(() => db.lineItems.update(item.id, prior))
      },
    },
  })
  return patch
}
