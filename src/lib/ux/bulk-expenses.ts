import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../db-write'
import { canMarkPaid, markPaidPatch } from '../expense-display'
import { showToast } from '../toast'

export async function bulkMarkPaid(items: LineItem[]): Promise<number> {
  const targets = items.filter(canMarkPaid)
  if (!targets.length) {
    showToast('Nothing to mark paid')
    return 0
  }
  await dbWrite(() =>
    db.transaction('rw', db.lineItems, async () => {
      for (const item of targets) {
        await db.lineItems.update(item.id, markPaidPatch(item))
      }
    }),
  )
  showToast(`Marked ${targets.length} paid`)
  return targets.length
}

export async function bulkSetDueDate(items: LineItem[], dueDate: string): Promise<number> {
  const targets = items.filter((i) => i.status !== 'paid' && !/^budget$/i.test(i.label.trim()))
  if (!targets.length) {
    showToast('Nothing to update')
    return 0
  }
  await dbWrite(() =>
    db.transaction('rw', db.lineItems, async () => {
      for (const item of targets) {
        await db.lineItems.update(item.id, { dueDate })
      }
    }),
  )
  showToast(`Set due date on ${targets.length}`)
  return targets.length
}

export async function bulkSetCategory(items: LineItem[], categoryId: string): Promise<number> {
  const targets = items.filter((i) => i.categoryId !== categoryId)
  if (!targets.length) {
    showToast('Already in that category')
    return 0
  }
  await dbWrite(() =>
    db.transaction('rw', db.lineItems, async () => {
      for (const item of targets) {
        await db.lineItems.update(item.id, { categoryId })
      }
    }),
  )
  showToast(`Moved ${targets.length} to category`)
  return targets.length
}
