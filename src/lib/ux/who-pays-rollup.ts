import type { Fund, LineItem, WhoPays } from '../../db/types'
import { formatMoney, sum } from '../money'
import type { SiteSettings } from '../site-settings'
import { whoPaysLabel } from './who-pays-label'

export type WhoPaysRollup = {
  key: WhoPays | 'unset'
  label: string
  amount: number
  count: number
}

export type WhoPaysSplit = {
  left: number
  right: number
}

/** Dollar split when either side is set; otherwise null. */
export function whoPaysSplitAmounts(item: LineItem): WhoPaysSplit | null {
  const left = item.whoPaysLeft
  const right = item.whoPaysRight
  if (left == null && right == null) return null
  return {
    left: left != null && left > 0 ? left : 0,
    right: right != null && right > 0 ? right : 0,
  }
}

/** Roll up left/right dollar splits across lines (budget lines skipped). */
export function whoPaysDollarRollup(
  items: LineItem[],
  site: SiteSettings,
): { leftLabel: string; rightLabel: string; left: number; right: number } | null {
  let left = 0
  let right = 0
  let any = false
  for (const item of items) {
    if (/^budget$/i.test(item.label.trim())) continue
    const split = whoPaysSplitAmounts(item)
    if (!split) continue
    any = true
    left += split.left
    right += split.right
  }
  if (!any) return null
  return {
    leftLabel: site.brandLeft.trim() || 'Left',
    rightLabel: site.brandRight.trim() || 'Right',
    left: sum([left]),
    right: sum([right]),
  }
}

/** Invoice delta vs locked quote; null when no quote locked. */
export function quoteDelta(item: LineItem): number | null {
  if (item.quotedAmount == null) return null
  return Math.round((item.amount - item.quotedAmount) * 100) / 100
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

/** Prefer dollar split rollup when present; else tag rollup. */
export function whoPaysDisplayLines(
  items: LineItem[],
  site: SiteSettings,
): Array<{ label: string; amount: number }> {
  const dollars = whoPaysDollarRollup(items, site)
  if (dollars) {
    return [
      { label: dollars.leftLabel, amount: dollars.left },
      { label: dollars.rightLabel, amount: dollars.right },
    ].filter((r) => r.amount > 0)
  }
  return whoPaysRollup(items, site)
    .filter((r) => r.key !== 'unset')
    .map((r) => ({ label: r.label, amount: r.amount }))
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

export type SettleSide = {
  key: WhoPays
  label: string
  responsible: number
  paid: number
  owes: number
}

/** Paid / owes settle-up from whoPays tags and left$/right$ splits. */
export function whoPaysSettlement(
  items: LineItem[],
  site: SiteSettings,
): SettleSide[] | null {
  let leftResp = 0
  let rightResp = 0
  let leftPaid = 0
  let rightPaid = 0
  let any = false

  for (const item of items) {
    if (/^budget$/i.test(item.label.trim())) continue
    if (!item.whoPays && item.whoPaysLeft == null && item.whoPaysRight == null) continue
    any = true
    const amount = item.amount > 0 ? item.amount : 0
    const paid = Math.max(0, item.paidAmount)
    const cappedPaid = amount > 0 ? Math.min(paid, amount) : paid
    const split = whoPaysSplitAmounts(item)

    if (split) {
      const resp = split.left + split.right
      if (!(resp > 0)) continue
      leftResp += split.left
      rightResp += split.right
      leftPaid += Math.round(cappedPaid * (split.left / resp) * 100) / 100
      rightPaid += Math.round(cappedPaid * (split.right / resp) * 100) / 100
      continue
    }

    if (item.whoPays === 'left') {
      leftResp += amount
      leftPaid += cappedPaid
    } else if (item.whoPays === 'right') {
      rightResp += amount
      rightPaid += cappedPaid
    } else if (item.whoPays === 'joint') {
      const half = Math.round((amount / 2) * 100) / 100
      const halfPaid = Math.round((cappedPaid / 2) * 100) / 100
      leftResp += half
      rightResp += half
      leftPaid += halfPaid
      rightPaid += halfPaid
    }
  }

  if (!any) return null

  const sides: SettleSide[] = []
  const push = (key: WhoPays, label: string, responsible: number, paid: number) => {
    if (!(responsible > 0 || paid > 0)) return
    const r = Math.round(responsible * 100) / 100
    const p = Math.round(paid * 100) / 100
    sides.push({
      key,
      label,
      responsible: r,
      paid: p,
      owes: Math.max(0, Math.round((r - p) * 100) / 100),
    })
  }
  push('left', site.brandLeft.trim() || 'Left', leftResp, leftPaid)
  push('right', site.brandRight.trim() || 'Right', rightResp, rightPaid)
  return sides.length ? sides : null
}

export function formatSettlementCue(sides: SettleSide[]): string {
  return sides
    .map((s) =>
      s.owes > 0
        ? `${s.label} paid ${formatMoney(s.paid)} · owes ${formatMoney(s.owes)}`
        : `${s.label} paid ${formatMoney(s.paid)} · settled`,
    )
    .join(' · ')
}
