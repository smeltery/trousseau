import { db } from '../../db/dexie'
import type { Fund } from '../../db/types'
import { dbWrite } from '../db-write'
import { showToast } from '../toast'

/** Mark selected gifts thanked. */
export async function bulkThank(funds: Fund[]): Promise<number> {
  const targets = funds.filter((f) => f.type === 'gift' && !f.thanked)
  if (!targets.length) {
    showToast('Nothing to thank')
    return 0
  }
  await dbWrite(() =>
    db.transaction('rw', db.funds, async () => {
      for (const fund of targets) {
        await db.funds.update(fund.id, { thanked: true })
      }
    }),
  )
  showToast(targets.length === 1 ? 'Marked thanked' : `Thanked ${targets.length} gifts`)
  return targets.length
}
