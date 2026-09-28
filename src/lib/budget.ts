import type { Category, CategoryGroup, LineItem, LineStatus } from '../db/types'
import { formatMoney, sum } from './money'

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  venue: 'Venue Expenses',
  vendor: 'Vendors / Additional',
  reimbursement: 'Items to be Reimbursed',
}

export const GROUP_ORDER: CategoryGroup[] = ['venue', 'vendor', 'reimbursement']

export const STATUS_LABELS: Record<LineStatus, string> = {
  planned: 'Planned',
  deposit: 'Deposit',
  partial: 'Partial',
  paid: 'Paid',
}

export function categoryTotals(items: LineItem[]) {
  const amount = sum(items.map((i) => i.amount))
  const paid = sum(items.map((i) => i.paidAmount))
  return { amount, paid, remaining: amount - paid }
}

export function groupCategories(categories: Category[], group: CategoryGroup) {
  return categories.filter((c) => c.group === group).sort((a, b) => a.sort - b.sort)
}

export function moneyLeftCopy(remaining: number): string {
  if (remaining < 0) return `${formatMoney(Math.abs(remaining))} over`
  return formatMoney(remaining)
}
