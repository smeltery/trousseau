import type { Fund, LineItem, WhoPays } from '../../db/types'
import { sum } from '../money'
import type { SiteSettings } from '../site-settings'
import { whoPaysLabel } from './who-pays-label'

export type WhoPaysRollup = {
  key: WhoPays | 'unset'
  label: string
  amount: number
  count: number
}

/** Remaining expected amounts grouped by whoPays (budget lines skipped). */
export function whoPaysRollup(
  items: LineItem[],
  site: SiteSettings,
): WhoPaysRollup[] {
  const buckets: Record<WhoPays | 'unset', { amount: number; count: number }> = {
    left: { amount: 0, count: 0 },
    right: { amount: 0, count: 0 },
    joint: { amount: 0, count: 0 },
    unset: { amount: 0, count: 0 },
  }
  for (const item of items) {
    if (/^budget$/i.test(item.label.trim())) continue
    const key: WhoPays | 'unset' = item.whoPays ?? 'unset'
    buckets[key].amount += item.amount
    buckets[key].count += 1
  }
  const order: Array<WhoPays | 'unset'> = ['left', 'right', 'joint', 'unset']
  return order
    .filter((k) => buckets[k].count > 0)
    .map((k) => ({
      key: k,
      label: k === 'unset' ? 'Unset' : whoPaysLabel(k, site) ?? k,
      amount: buckets[k].amount,
      count: buckets[k].count,
    }))
}

/** Promised (no receivedDate) vs received gift totals. */
export function giftPromiseRollup(funds: Fund[]): {
  promised: number
  received: number
  promisedCount: number
  receivedCount: number
} {
  let promised = 0
  let received = 0
  let promisedCount = 0
  let receivedCount = 0
  for (const f of funds) {
    if (f.type !== 'gift') continue
    if (f.receivedDate) {
      received += f.amount
      receivedCount += 1
    } else {
      promised += f.amount
      promisedCount += 1
    }
  }
  return { promised, received, promisedCount, receivedCount }
}

export function isGiftPromised(fund: Fund): boolean {
  return fund.type === 'gift' && !fund.receivedDate
}

export function isGiftReceived(fund: Fund): boolean {
  return fund.type === 'gift' && Boolean(fund.receivedDate)
}

export function dayOfCashTotal(tipCash?: number, vendorCash?: number): number {
  return sum([tipCash ?? 0, vendorCash ?? 0])
}
