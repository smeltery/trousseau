import type { Category, Fund, LineItem } from './types'

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`
}

/** Empty starter for new couples: rename everything to fit your wedding. */
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

/**
 * Generic filled demo for “Try demo”: fictional couple, round numbers.
 * Personal archives live in `public/samples/*.zip`.
 */
export const demoFunds: Fund[] = [
  { id: id('fund', 1), label: 'Family gift', amount: 18000, type: 'gift', sort: 0 },
  { id: id('fund', 2), label: 'Friends & shower', amount: 2500, type: 'gift', sort: 1 },
  { id: id('fund', 3), label: 'Couple savings', amount: 9000, type: 'savings', sort: 2 },
]

export const demoCategories: Category[] = [
  { id: id('cat', 1), name: 'Venue', group: 'venue', sort: 0 },
  { id: id('cat', 2), name: 'Catering', group: 'vendor', sort: 1 },
  { id: id('cat', 3), name: 'Music', group: 'vendor', sort: 2 },
  { id: id('cat', 4), name: 'Photographer', group: 'vendor', sort: 3 },
  { id: id('cat', 5), name: 'Florals', group: 'vendor', sort: 4 },
  { id: id('cat', 6), name: 'Attire', group: 'vendor', sort: 5 },
  { id: id('cat', 7), name: 'Rings', group: 'vendor', sort: 6 },
  { id: id('cat', 8), name: 'Security deposit return', group: 'reimbursement', sort: 7 },
]

export const demoLineItems: LineItem[] = [
  ...paymentPlan('cat-1', 1, [
    { label: 'Deposit', amount: 2000, paidAmount: 2000, status: 'paid' },
    { label: 'Balance', amount: 6000 },
  ]),
  ...paymentPlan('cat-2', 10, [
    { label: 'Budget', amount: 9000 },
    { label: 'Deposit', amount: 900, paidAmount: 900, status: 'paid' },
    { label: 'Remaining', amount: 8100 },
  ]),
  ...paymentPlan('cat-3', 20, [
    { label: 'Budget', amount: 2200 },
    { label: 'Deposit', amount: 440, paidAmount: 440, status: 'paid' },
    { label: 'Remaining', amount: 1760 },
  ]),
  ...paymentPlan('cat-4', 30, [
    { label: 'Budget', amount: 3500 },
    { label: 'Deposit', amount: 700, paidAmount: 700, status: 'paid' },
    { label: 'Remaining', amount: 2800 },
  ]),
  ...paymentPlan('cat-5', 40, [
    { label: 'Budget', amount: 1800 },
  ]),
  ...paymentPlan('cat-6', 50, [
    { label: 'Budget', amount: 2400 },
    { label: 'Deposit', amount: 400, paidAmount: 400, status: 'paid' },
  ]),
  ...paymentPlan('cat-7', 60, [
    { label: 'Budget', amount: 2800 },
    { label: 'Paid in full', amount: 2800, paidAmount: 2800, status: 'paid' },
  ]),
  ...paymentPlan('cat-8', 70, [{ label: 'Refundable deposit', amount: 500 }]),
]

/** @deprecated Prefer blank* / demo* exports */
export const seedFunds = blankFunds
export const seedCategories = blankCategories
export const seedLineItems = blankLineItems
