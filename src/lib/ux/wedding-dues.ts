import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { addDays } from '../calendar'
import { dbWrite } from '../db-write'

/** YYYY-MM-DD for N days before the wedding. */
export function dateFromWeddingOffset(weddingDate: string, offsetDays: number): string {
  return addDays(weddingDate, -offsetDays)
}

/** Recompute dueDate / remainingBalanceDueDate for lines with wedding offsets. */
export async function recomputeWeddingAnchoredDues(weddingDate: string): Promise<number> {
  const items = await db.lineItems.toArray()
  const updates: { id: string; patch: Partial<LineItem> }[] = []
  for (const item of items) {
    const patch: Partial<LineItem> = {}
    if (item.dueOffsetDays != null) {
      patch.dueDate = dateFromWeddingOffset(weddingDate, item.dueOffsetDays)
    }
    if (item.balanceOffsetDays != null) {
      patch.remainingBalanceDueDate = dateFromWeddingOffset(weddingDate, item.balanceOffsetDays)
    }
    if (Object.keys(patch).length) updates.push({ id: item.id, patch })
  }
  if (!updates.length) return 0
  await dbWrite(() =>
    db.transaction('rw', db.lineItems, async () => {
      for (const { id, patch } of updates) {
        await db.lineItems.update(id, patch)
      }
    }),
  )
  return updates.length
}
