import { db } from '../db/dexie'

/** Swap sort order for two rows that share a collection. */
export async function swapSort(
  table: 'categories' | 'lineItems' | 'funds',
  aId: string,
  bId: string,
): Promise<void> {
  await db.transaction('rw', db[table], async () => {
    const a = await db[table].get(aId)
    const b = await db[table].get(bId)
    if (!a || !b) return
    const aSort = a.sort
    await db[table].update(aId, { sort: b.sort })
    await db[table].update(bId, { sort: aSort })
  })
}
