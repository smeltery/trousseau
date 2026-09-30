import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../db-write'

/** Recompute amount = guestCount × perGuestAmount for plate-linked lines. */
export async function applyGuestCountToPlateLines(guestCount: number): Promise<number> {
  if (!(guestCount > 0)) return 0
  const items = await db.lineItems.toArray()
  const updates: { id: string; amount: number }[] = []
  for (const item of items) {
    if (!(item.perGuestAmount != null && item.perGuestAmount > 0)) continue
    const amount = Math.round(guestCount * item.perGuestAmount * 100) / 100
    if (amount !== item.amount) updates.push({ id: item.id, amount })
  }
  if (!updates.length) return 0
  await dbWrite(() =>
    db.transaction('rw', db.lineItems, async () => {
      for (const u of updates) {
        await db.lineItems.update(u.id, { amount: u.amount })
      }
    }),
  )
  return updates.length
}

export function plateAmount(guestCount: number, perGuest: number): number {
  return Math.round(guestCount * perGuest * 100) / 100
}

export function isPlateLinked(item: LineItem): boolean {
  return item.perGuestAmount != null && item.perGuestAmount > 0
}
