import type { Category, LineItem } from '../../db/types'
import { addDays, dueDateKeys } from '../calendar'

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

/** True when an unpaid line has any due date within [today, today+daysAhead]. */
export function isDueSoon(item: LineItem, today: string, daysAhead = 14): boolean {
  if (item.status === 'paid') return false
  if (/^budget$/i.test(item.label.trim())) return false
  const end = addDays(today, daysAhead)
  return dueDateKeys(item).some((d) => d >= today && d <= end)
}
