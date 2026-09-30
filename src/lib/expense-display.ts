import type { Attachment, Category, LineItem, PaymentStub } from '../db/types'
import { isOverdue, todayKey } from './calendar'
import { STATUS_LABELS } from './budget'
import { formatMoney, sum } from './money'

/** Prefer Budget line for category budget; avoid double-counting deposit + remaining. */
export function categoryDisplayTotals(items: LineItem[]) {
  const budgetLine = items.find((i) => /^budget$/i.test(i.label.trim()))
  return {
    amount: budgetLine ? budgetLine.amount : sum(items.map((i) => i.amount)),
    paid: sum(items.map((i) => i.paidAmount)),
  }
}

/** Planned expense total (Budget lines when present); excludes reimbursements. */
export function expensesRunningTotal(categories: Category[], lineItems: LineItem[]) {
  return sum(
    categories
      .filter((c) => c.group !== 'reimbursement')
      .map((cat) => categoryDisplayTotals(lineItems.filter((i) => i.categoryId === cat.id)).amount),
  )
}

/** Cash paid so far across all lines. */
export function expensesPaidTotal(lineItems: LineItem[]) {
  return sum(lineItems.map((i) => i.paidAmount))
}

export function formatDue(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Row amount: "$X of $Y" for partials, else paid or expected. */
export function formatLineAmount(item: LineItem): string {
  if (item.amount > 0 && item.paidAmount > 0 && item.paidAmount < item.amount) {
    return `${formatMoney(item.paidAmount)} of ${formatMoney(item.amount)}`
  }
  if (item.status === 'paid' && item.paidAmount > 0) return formatMoney(item.paidAmount)
  if (item.amount > 0) return formatMoney(item.amount)
  if (item.paidAmount > 0) return formatMoney(item.paidAmount)
  return '-'
}

export function paperLineStatus(
  item: LineItem,
  today = todayKey(),
): { label: string; tone: string; chip: 'paid' | 'due' | 'overdue' | 'partial' } {
  if (/^budget$/i.test(item.label.trim())) {
    return { label: '-', tone: 'text-[var(--ink-faint)]', chip: 'due' }
  }
  if (item.status === 'paid') return { label: 'Paid', tone: 'text-[var(--lichen)]', chip: 'paid' }
  if (isOverdue(item, today)) return { label: 'Overdue', tone: 'text-[var(--danger)]', chip: 'overdue' }
  if (item.status === 'deposit') {
    return { label: STATUS_LABELS.deposit, tone: 'text-[var(--accent-deep)]', chip: 'partial' }
  }
  if (item.status === 'partial' || (item.paidAmount > 0 && item.amount > item.paidAmount)) {
    return { label: STATUS_LABELS.partial, tone: 'text-[var(--accent-deep)]', chip: 'partial' }
  }
  return { label: 'Due', tone: 'text-[var(--ink-faint)]', chip: 'due' }
}

export function markPaidPatch(item: LineItem): Partial<LineItem> {
  const paidAmount = item.amount > 0 ? item.amount : Math.max(item.paidAmount, 0)
  return { status: 'paid', paidAmount }
}

export function canMarkPaid(item: LineItem): boolean {
  if (item.status === 'paid') return false
  if (/^budget$/i.test(item.label.trim())) return false
  return item.amount > 0
}

/** Apply an incremental payment; promotes status to partial/deposit/paid and appends a stub. */
export function recordPaymentPatch(
  item: LineItem,
  payment: number,
  meta?: { note?: string; method?: string; fundId?: string },
): Partial<LineItem> | null {
  if (!(payment > 0)) return null
  const paidAmount = Math.round((item.paidAmount + payment) * 100) / 100
  const note = meta?.note?.trim() || undefined
  const method = meta?.method?.trim() || undefined
  const fundId = meta?.fundId?.trim() || undefined
  const payments = [
    ...(item.payments ?? []),
    {
      id: crypto.randomUUID().slice(0, 8),
      amount: payment,
      date: todayKey(),
      ...(note ? { note } : {}),
      ...(method ? { method } : {}),
      ...(fundId ? { fundId } : {}),
    },
  ]
  if (item.amount > 0 && paidAmount >= item.amount) {
    return { status: 'paid', paidAmount: item.amount, payments }
  }
  const status = item.status === 'planned' && item.paidAmount === 0 ? 'deposit' : 'partial'
  return { status, paidAmount, payments }
}

/** Recompute paidAmount + status from the payment stub list (durable edit/remove). */
export function recomputeFromPayments(
  item: LineItem,
  payments: PaymentStub[],
): Partial<LineItem> {
  const paidAmount = Math.round(sum(payments.map((p) => p.amount)) * 100) / 100
  if (payments.length === 0) {
    return { payments: undefined, paidAmount: 0, status: 'planned' }
  }
  if (item.amount > 0 && paidAmount >= item.amount) {
    return { payments, paidAmount: item.amount, status: 'paid' }
  }
  return {
    payments,
    paidAmount,
    status: payments.length === 1 ? 'deposit' : 'partial',
  }
}

export function removePaymentPatch(
  item: LineItem,
  paymentId: string,
): Partial<LineItem> | null {
  const payments = item.payments ?? []
  if (!payments.some((p) => p.id === paymentId)) return null
  return recomputeFromPayments(
    item,
    payments.filter((p) => p.id !== paymentId),
  )
}

export function updatePaymentPatch(
  item: LineItem,
  paymentId: string,
  patch: Partial<Pick<PaymentStub, 'amount' | 'date' | 'note' | 'method' | 'fundId'>>,
): Partial<LineItem> | null {
  const payments = item.payments ?? []
  const idx = payments.findIndex((p) => p.id === paymentId)
  if (idx < 0) return null
  const cur = payments[idx]!
  const nextAmount = patch.amount != null ? patch.amount : cur.amount
  if (!(nextAmount > 0)) return null
  const updated: PaymentStub = {
    ...cur,
    amount: nextAmount,
    date: patch.date ?? cur.date,
    note: patch.note !== undefined ? patch.note.trim() || undefined : cur.note,
    method: patch.method !== undefined ? patch.method.trim() || undefined : cur.method,
    fundId: patch.fundId !== undefined ? patch.fundId.trim() || undefined : cur.fundId,
  }
  const next = [...payments]
  next[idx] = updated
  return recomputeFromPayments(item, next)
}

/** Paid line with no receipt-role attachment (budget lines ignored). */
export function isPaidWithoutReceipt(
  item: LineItem,
  attachments: Attachment[],
): boolean {
  if (item.status !== 'paid') return false
  if (/^budget$/i.test(item.label.trim())) return false
  return !attachments.some((a) => a.lineItemId === item.id && a.role === 'receipt')
}

/** True when category has ≥1 non-budget line and all of them are paid. */
export function isCategoryFullyPaid(cat: Category, lineItems: LineItem[]): boolean {
  const items = lineItems.filter(
    (i) => i.categoryId === cat.id && !/^budget$/i.test(i.label.trim()),
  )
  if (items.length === 0) return false
  return items.every((i) => i.status === 'paid')
}

export function daysUntil(iso: string, today = todayKey()): number {
  const a = new Date(`${today}T12:00:00`).getTime()
  const b = new Date(`${iso}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function weddingCountdown(iso: string | undefined, today = todayKey()): string | null {
  if (!iso) return null
  const days = daysUntil(iso, today)
  if (days === 0) return 'Wedding day'
  if (days === 1) return '1 day to go'
  if (days > 1) return `${days} days to go`
  if (days === -1) return '1 day ago'
  return `${Math.abs(days)} days ago`
}

/** Non-budget expense ids ordered by category.sort then item.sort. */
export function orderedExpenseIds(categories: Category[], lineItems: LineItem[]): string[] {
  return categories.flatMap((cat) =>
    lineItems
      .filter((i) => i.categoryId === cat.id && !/^budget$/i.test(i.label.trim()))
      .sort((a, b) => a.sort - b.sort)
      .map((i) => i.id),
  )
}
