import type { Category, LineItem } from '../db/types'
import { sum } from './money'

/** Prefer Budget line for category budget; avoid double-counting deposit + remaining. */
export function categoryDisplayTotals(items: LineItem[]) {
  const budgetLine = items.find((i) => /^budget$/i.test(i.label.trim()))
  return {
    amount: budgetLine ? budgetLine.amount : sum(items.map((i) => i.amount)),
    paid: sum(items.map((i) => i.paidAmount)),
  }
}

/** Match Paper: exclude reimbursements; use Budget when present, else sum lines. */
export function expensesRunningTotal(categories: Category[], lineItems: LineItem[]) {
  return sum(
    categories
      .filter((c) => c.group !== 'reimbursement')
      .map((cat) => categoryDisplayTotals(lineItems.filter((i) => i.categoryId === cat.id)).amount),
  )
}

export function formatDue(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function paperLineStatus(item: LineItem): { label: string; tone: string } {
  if (item.status === 'paid') return { label: 'Paid', tone: 'text-[var(--lichen)]' }
  if (/^budget$/i.test(item.label.trim())) return { label: '-', tone: 'text-[var(--ink-faint)]' }
  return { label: 'Due', tone: 'text-[var(--ink-faint)]' }
}
