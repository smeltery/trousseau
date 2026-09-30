import type { Category, Fund, LineItem } from '../../db/types'
import { expensesPaidTotal, expensesRunningTotal } from '../expense-display'
import { addDays } from '../calendar'
import { sum } from '../money'
import type { SiteSettings } from '../site-settings'

export type WrapSummary = {
  unthanked: Fund[]
  openRefunds: LineItem[]
  spent: number
  allocated: number
  planned: number
  dayOfGifts: Fund[]
}

/** True when wedding date is set and has passed. */
export function isPostWedding(site: SiteSettings, today: string): boolean {
  return Boolean(site.weddingDate && site.weddingDate < today)
}

/** Day-of gift haul: gifts received from day-before through day-after wedding. */
export function dayOfGiftHaul(funds: Fund[], weddingDate: string): Fund[] {
  const start = addDays(weddingDate, -1)
  const end = addDays(weddingDate, 1)
  return funds.filter(
    (f) =>
      f.type === 'gift' &&
      f.receivedDate &&
      f.receivedDate >= start &&
      f.receivedDate <= end,
  )
}

export function buildWrapSummary(
  site: SiteSettings,
  funds: Fund[],
  categories: Category[],
  lineItems: LineItem[],
  today: string,
): WrapSummary | null {
  if (!isPostWedding(site, today) || !site.weddingDate) return null
  const unthanked = funds.filter((f) => f.type === 'gift' && !f.thanked)
  const reimburseIds = new Set(
    categories.filter((c) => c.group === 'reimbursement').map((c) => c.id),
  )
  const openRefunds = lineItems.filter(
    (i) => reimburseIds.has(i.categoryId) && !i.backReceived,
  )
  const allocated = sum(funds.map((f) => f.amount))
  return {
    unthanked,
    openRefunds,
    spent: expensesPaidTotal(lineItems),
    allocated,
    planned: expensesRunningTotal(categories, lineItems),
    dayOfGifts: dayOfGiftHaul(funds, site.weddingDate),
  }
}
