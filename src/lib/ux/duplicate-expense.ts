import { db, newId } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../db-write'
import { showToast } from '../toast'

/** Clone amount/due/category/notes/vendor; status resets to unpaid. */
export async function duplicateExpense(item: LineItem): Promise<string | undefined> {
  const siblings = await db.lineItems.where('categoryId').equals(item.categoryId).toArray()
  const sort = siblings.length ? Math.max(...siblings.map((s) => s.sort)) + 1 : 0
  const id = newId('line')
  const saved = await dbWrite(() =>
    db.lineItems.add({
      id,
      categoryId: item.categoryId,
      label: `${item.label} (copy)`,
      amount: item.amount,
      paidAmount: 0,
      status: 'planned',
      dueDate: item.dueDate,
      notes: item.notes,
      vendorUrl: item.vendorUrl,
      sort,
    }),
  )
  if (saved === undefined) return undefined
  showToast('Expense duplicated')
  return id
}
