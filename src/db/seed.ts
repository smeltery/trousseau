import type { SiteSettings } from '../lib/site-settings'
import { DEFAULT_SITE } from '../lib/site-settings'
import type { Category, Fund, LineItem, LineStatus } from './types'

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Round to a friendly wedding-budget step (default $50). */
function roundNice(n: number, step = 50): number {
  return Math.max(step, Math.round(n / step) * step)
}

function between(min: number, max: number, step = 50): number {
  return roundNice(randInt(min, max), step)
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

function offsetDate(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function paymentPlan(
  categoryId: string,
  startSort: number,
  lines: Array<{
    label: string
    amount?: number
    paidAmount?: number
    status?: LineStatus
    dueDate?: string
  }>,
): LineItem[] {
  return lines.map((line, i) => ({
    id: id('line', startSort + i),
    categoryId,
    label: line.label,
    amount: line.amount ?? 0,
    paidAmount: line.paidAmount ?? 0,
    status: line.status ?? 'planned',
    dueDate: line.dueDate,
    sort: i,
  }))
}

const COUPLE_NAMES = [
  ['Alex', 'Jordan'],
  ['Sam', 'Riley'],
  ['Casey', 'Morgan'],
  ['Maya', 'Chris'],
  ['Elena', 'James'],
  ['Priya', 'Noah'],
  ['Sofia', 'Owen'],
  ['Avery', 'Quinn'],
  ['Grace', 'Theo'],
  ['Nina', 'Leo'],
] as const

const FAMILY_GIFT_LABELS = ['Family gift', "Parents' gift", 'Both families', 'Family contribution'] as const
const FRIENDS_GIFT_LABELS = ['Friends & shower', 'Shower gifts', 'Friends & coworkers', 'Bridal shower'] as const
const SAVINGS_LABELS = ['Couple savings', 'Our savings', 'Joint wedding fund', 'Honeymoon & wedding savings'] as const

type VendorSpec = {
  name: string
  group: Category['group']
  min: number
  max: number
  plan: 'deposit-balance' | 'budget-deposit-remaining' | 'paid-in-full' | 'budget-only' | 'refund'
}

const CORE_VENDORS: VendorSpec[] = [
  { name: 'Venue', group: 'venue', min: 5000, max: 14000, plan: 'deposit-balance' },
  { name: 'Catering', group: 'vendor', min: 6000, max: 16000, plan: 'budget-deposit-remaining' },
  { name: 'Music', group: 'vendor', min: 1200, max: 4000, plan: 'budget-deposit-remaining' },
  { name: 'Photographer', group: 'vendor', min: 2200, max: 5500, plan: 'budget-deposit-remaining' },
  { name: 'Florals', group: 'vendor', min: 900, max: 3200, plan: 'budget-only' },
  { name: 'Attire', group: 'vendor', min: 1400, max: 4200, plan: 'budget-deposit-remaining' },
  { name: 'Rings', group: 'vendor', min: 1600, max: 4800, plan: 'paid-in-full' },
]

const EXTRA_VENDORS: VendorSpec[] = [
  { name: 'Cake', group: 'vendor', min: 350, max: 900, plan: 'budget-only' },
  { name: 'Videographer', group: 'vendor', min: 1800, max: 4000, plan: 'budget-deposit-remaining' },
  { name: 'Stationery', group: 'vendor', min: 400, max: 1200, plan: 'budget-only' },
  { name: 'Hair & makeup', group: 'vendor', min: 500, max: 1400, plan: 'budget-deposit-remaining' },
]

function buildVendorPlan(
  categoryId: string,
  lineStart: number,
  total: number,
  plan: VendorSpec['plan'],
): LineItem[] {
  if (plan === 'refund') {
    return paymentPlan(categoryId, lineStart, [
      {
        label: 'Refundable deposit',
        amount: total,
        dueDate: offsetDate(randInt(-12, 5)),
      },
    ])
  }

  if (plan === 'budget-only') {
    return paymentPlan(categoryId, lineStart, [
      { label: 'Budget', amount: total, dueDate: offsetDate(randInt(14, 75)) },
    ])
  }

  if (plan === 'paid-in-full') {
    return paymentPlan(categoryId, lineStart, [
      { label: 'Budget', amount: total },
      {
        label: 'Paid in full',
        amount: total,
        paidAmount: total,
        status: 'paid',
        dueDate: offsetDate(randInt(-60, -10)),
      },
    ])
  }

  const depositPct = pick([0.1, 0.15, 0.2, 0.25])
  const deposit = roundNice(total * depositPct)
  const remaining = Math.max(0, total - deposit)

  if (plan === 'deposit-balance') {
    return paymentPlan(categoryId, lineStart, [
      {
        label: 'Deposit',
        amount: deposit,
        paidAmount: deposit,
        status: 'paid',
        dueDate: offsetDate(randInt(-70, -20)),
      },
      {
        label: 'Balance',
        amount: remaining,
        dueDate: offsetDate(randInt(20, 90)),
      },
    ])
  }

  // budget-deposit-remaining — show envelope + progress
  const remainingPaid = Math.random() < 0.25
  const remainingStatus: LineStatus = remainingPaid ? 'paid' : 'planned'
  return paymentPlan(categoryId, lineStart, [
    { label: 'Budget', amount: total },
    {
      label: 'Deposit',
      amount: deposit,
      paidAmount: deposit,
      status: 'paid',
      dueDate: offsetDate(randInt(-45, -5)),
    },
    {
      label: 'Remaining',
      amount: remaining,
      paidAmount: remainingPaid ? remaining : 0,
      status: remainingStatus,
      dueDate: remainingPaid ? offsetDate(randInt(-20, -1)) : offsetDate(randInt(5, 100)),
    },
  ])
}

/**
 * Fresh filled demo for “Try demo”: fictional couple, coherent round numbers.
 * Personal archives live in `public/samples/*.zip`.
 */
export function buildDemoSample(): {
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  site: SiteSettings
} {
  const [brandLeft, brandRight] = pick(COUPLE_NAMES)

  const vendors: VendorSpec[] = [...CORE_VENDORS]
  // Occasionally add 0–2 extras so demos feel distinct without cluttering every run.
  const extraCount = randInt(0, 2)
  const shuffledExtras = [...EXTRA_VENDORS].sort(() => Math.random() - 0.5)
  vendors.push(...shuffledExtras.slice(0, extraCount))

  const refundAmount = between(300, 800)
  vendors.push({
    name: 'Security deposit return',
    group: 'reimbursement',
    min: refundAmount,
    max: refundAmount,
    plan: 'refund',
  })

  const categories: Category[] = vendors.map((v, i) => ({
    id: id('cat', i + 1),
    name: v.name,
    group: v.group,
    sort: i,
  }))

  let lineCursor = 1
  const lineItems: LineItem[] = []
  let spendTotal = 0

  vendors.forEach((vendor, i) => {
    const total =
      vendor.plan === 'refund' ? refundAmount : between(vendor.min, vendor.max, vendor.max > 2000 ? 100 : 50)
    if (vendor.group !== 'reimbursement') spendTotal += total
    const lines = buildVendorPlan(categories[i]!.id, lineCursor, total, vendor.plan)
    lineCursor += 10
    lineItems.push(...lines)
  })

  // Funds should roughly cover spend — slightly over or under is fine for a real-looking demo.
  const coverRatio = pick([0.92, 0.97, 1.0, 1.05, 1.12])
  const fundPool = roundNice(spendTotal * coverRatio, 100)
  const familyShare = pick([0.5, 0.55, 0.6, 0.65])
  const friendsShare = pick([0.08, 0.1, 0.12, 0.15])
  const family = roundNice(fundPool * familyShare, 100)
  const friends = roundNice(fundPool * friendsShare, 50)
  const savings = Math.max(500, roundNice(fundPool - family - friends, 100))

  const funds: Fund[] = [
    { id: id('fund', 1), label: pick(FAMILY_GIFT_LABELS), amount: family, type: 'gift', sort: 0, source: pick(['Mom & Dad', 'Both families', 'The Millers']), receivedDate: offsetDate(-randInt(30, 90)) },
    { id: id('fund', 2), label: pick(FRIENDS_GIFT_LABELS), amount: friends, type: 'gift', sort: 1, source: pick(['College friends', 'Coworkers', 'Bridal party']), receivedDate: offsetDate(-randInt(7, 45)) },
    { id: id('fund', 3), label: pick(SAVINGS_LABELS), amount: savings, type: 'savings', sort: 2 },
  ]

  return {
    funds,
    categories,
    lineItems,
    site: {
      ...DEFAULT_SITE,
      brandLeft,
      brandRight,
      weddingDate: offsetDate(randInt(100, 140)),
      fundsSub: 'Sample gifts and savings so you can explore the layout before using your own numbers.',
    },
  }
}

/** @deprecated Prefer blank* exports / buildDemoSample() */
export const seedFunds = blankFunds
export const seedCategories = blankCategories
export const seedLineItems = blankLineItems
