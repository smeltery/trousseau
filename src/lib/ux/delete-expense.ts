import { db } from '../../db/dexie'
import type { Attachment, LineItem } from '../../db/types'
import { dbWrite } from '../db-write'
import { dismissToast, showToast } from '../toast'

/** Delete a line item + attachments with an undo toast that restores both. */
export async function deleteExpenseWithUndo(item: LineItem): Promise<void> {
  const attachments = await db.attachments.where('lineItemId').equals(item.id).toArray()
  const snapshot: LineItem = { ...item }
  const attSnapshot: Attachment[] = attachments.map((a) => ({ ...a }))

  await dbWrite(() =>
    db.transaction('rw', db.lineItems, db.attachments, async () => {
      await db.attachments.where('lineItemId').equals(item.id).delete()
      await db.lineItems.delete(item.id)
    }),
  )

  const id = showToast('Expense deleted', {
    durationMs: 5600,
    action: {
      label: 'Undo',
      onClick: () => {
        dismissToast(id)
        void dbWrite(() =>
          db.transaction('rw', db.lineItems, db.attachments, async () => {
            await db.lineItems.bulkAdd([snapshot])
            if (attSnapshot.length) await db.attachments.bulkAdd(attSnapshot)
          }),
        )
      },
    },
  })
}
