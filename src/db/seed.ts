import type { Category, Fund, LineItem } from './types'

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`
}

/** Empty starter for new couples — rename everything to fit your wedding. */
export const blankFunds: Fund[] = []

export const blankCategories: Category[] = [
  { id: id('cat', 1), name: 'Venue', group: 'venue', sort: 0 },
  { id: id('cat', 2), name: 'Catering', group: 'vendor', sort: 1 },
  { id: id('cat', 3), name: 'Photographer', group: 'vendor', sort: 2 },
  { id: id('cat', 4), name: 'Music', group: 'vendor', sort: 3 },
  { id: id('cat', 5), name: 'Attire', group: 'vendor', sort: 4 },
  { id: id('cat', 6), name: 'Rings', group: 'vendor', sort: 5 },
  { id: id('cat', 7), name: 'Reimbursements', group: 'reimbursement', sort: 6 },
]

export const blankLineItems: LineItem[] = [
  {
    id: id('line', 1),
    categoryId: 'cat-1',
    label: 'Deposit',
    amount: 0,
    paidAmount: 0,
    status: 'planned',
    sort: 0,
  },
]

/**
 * Optional filled demo (Nick & Lauren sample) for “Try demo” / Backup.
 * Not the default for new installs.
 */
export const demoFunds: Fund[] = [
  { id: id('fund', 1), label: 'Family gift', amount: 25000, type: 'gift', sort: 0 },
  { id: id('fund', 2), label: 'Wedding savings', amount: 7000, type: 'savings', sort: 1 },
]

export const demoCategories: Category[] = [
  { id: id('cat', 1), name: 'Venue', group: 'venue', sort: 0 },
  { id: id('cat', 2), name: 'Catering', group: 'vendor', sort: 1 },
  { id: id('cat', 3), name: 'DJ / Band', group: 'vendor', sort: 2 },
  { id: id('cat', 4), name: 'Photographer', group: 'vendor', sort: 3 },
  { id: id('cat', 5), name: 'Hair and Makeup', group: 'vendor', sort: 4 },
  { id: id('cat', 6), name: 'Attire', group: 'vendor', sort: 5 },
  { id: id('cat', 7), name: 'Rings', group: 'vendor', sort: 6 },
  { id: id('cat', 8), name: 'Invitations', group: 'vendor', sort: 7 },
  { id: id('cat', 9), name: 'Security deposit return', group: 'reimbursement', sort: 8 },
]

function paymentPlan(
  categoryId: string,
  startSort: number,
  lines: Array<{ label: string; amount?: number; paidAmount?: number; status?: LineItem['status'] }>,
): LineItem[] {
  return lines.map((line, i) => ({
    id: id('line', startSort + i),
    categoryId,
    label: line.label,
    amount: line.amount ?? 0,
    paidAmount: line.paidAmount ?? 0,
    status: line.status ?? 'planned',
    sort: i,
  }))
}

export const demoLineItems: LineItem[] = [
  ...paymentPlan('cat-1', 1, [
    { label: 'Deposit', amount: 1000, paidAmount: 1000, status: 'paid' },
    { label: 'Progress payment', amount: 3050 },
    { label: 'Final payment', amount: 3550 },
  ]),
  ...paymentPlan('cat-2', 10, [
    { label: 'Budget', amount: 10748.1 },
    { label: 'Deposit', amount: 517.5, paidAmount: 517.5, status: 'paid' },
    { label: 'Remaining', amount: 10230.6 },
  ]),
  ...paymentPlan('cat-3', 20, [
    { label: 'Budget', amount: 2450 },
    { label: 'Deposit', amount: 490, paidAmount: 490, status: 'paid' },
    { label: 'Remaining', amount: 1960 },
  ]),
  ...paymentPlan('cat-4', 30, [
    { label: 'Budget', amount: 3016 },
    { label: 'Deposit', amount: 530, paidAmount: 530, status: 'paid' },
    { label: 'Remaining', amount: 2486 },
  ]),
  ...paymentPlan('cat-7', 40, [
    { label: 'Budget', amount: 3083.54 },
    { label: 'Deposit', amount: 1541.77, paidAmount: 1541.77, status: 'paid' },
    { label: 'Remaining', amount: 1541.77, paidAmount: 1541.77, status: 'paid' },
  ]),
  ...paymentPlan('cat-9', 50, [{ label: 'Total', amount: 500 }]),
]

/** @deprecated Prefer blank* / demo* exports */
export const seedFunds = blankFunds
export const seedCategories = blankCategories
export const seedLineItems = blankLineItems
