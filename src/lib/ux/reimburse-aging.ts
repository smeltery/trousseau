import type { Category, LineItem } from '../../db/types'

/** Reimbursement lines expected back by today (or undated) and not yet received. */
export function isReimbursementAging(
  item: LineItem,
  categories: Category[],
  today: string,
): boolean {
  const cat = categories.find((c) => c.id === item.categoryId)
  if (cat?.group !== 'reimbursement') return false
  if (item.backReceived) return false
  if (!item.expectedBackDate) return true
  return item.expectedBackDate < today
}
