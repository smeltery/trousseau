import type { BackupPayload, Category, Fund, LineItem } from './types'
import type { SiteSettings } from '../lib/site-settings'
import { DEFAULT_SITE } from '../lib/site-settings'

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`
}

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

/** Personal wedding archive: distributed as `public/samples/nick-lauren-wedding.zip`. */
export const nickLaurenSite: SiteSettings = {
  ...DEFAULT_SITE,
  brandLeft: 'Nick',
  brandRight: 'Lauren',
  fundsSub: 'Gifts and wedding savings that make up your allocated total.',
}

export const nickLaurenFunds: Fund[] = [
  {
    id: id('fund', 1),
    label: 'Adamous',
    amount: 25000,
    type: 'gift',
    sort: 0,
    source: 'The Adamous family',
    receivedDate: '2025-11-12',
  },
  {
    id: id('fund', 2),
    label: 'Freys',
    amount: 7600,
    type: 'gift',
    sort: 1,
    source: 'The Freys',
    receivedDate: '2025-12-03',
  },
  { id: id('fund', 3), label: 'Total Targeting', amount: 7000, type: 'savings', sort: 2 },
]

export const nickLaurenCategories: Category[] = [
  { id: id('cat', 1), name: 'Whitewoods', group: 'venue', sort: 0 },
  { id: id('cat', 2), name: 'Catering', group: 'vendor', sort: 1 },
  { id: id('cat', 3), name: 'DJ/Band', group: 'vendor', sort: 2 },
  { id: id('cat', 4), name: 'Photographer', group: 'vendor', sort: 3 },
  { id: id('cat', 5), name: 'Hair and Makeup', group: 'vendor', sort: 4 },
  { id: id('cat', 6), name: 'Attire', group: 'vendor', sort: 5 },
  { id: id('cat', 7), name: 'Wedding Rings', group: 'vendor', sort: 6 },
  { id: id('cat', 8), name: 'Invitations', group: 'vendor', sort: 7 },
  { id: id('cat', 9), name: 'Venue Security Deposit', group: 'reimbursement', sort: 8 },
]

export const nickLaurenLineItems: LineItem[] = [
  ...paymentPlan('cat-1', 1, [
    { label: 'Deposit', amount: 1000, paidAmount: 1000, status: 'paid' },
    { label: 'Progress Payment 1', amount: 3050 },
    { label: 'WedSafe', amount: 200 },
    { label: 'Final Payment', amount: 3550 },
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

export function nickLaurenBackupPayload(): BackupPayload {
  return {
    version: 2,
    exportedAt: '2026-09-28T00:00:00.000Z',
    funds: nickLaurenFunds,
    categories: nickLaurenCategories,
    lineItems: nickLaurenLineItems,
    attachments: [],
    site: JSON.stringify(nickLaurenSite),
  }
}
