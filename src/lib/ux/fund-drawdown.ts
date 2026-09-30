import type { Fund, LineItem } from '../../db/types'

/** Total drawn from a fund via payment stubs’ fundId. */
export function fundDrawn(fundId: string, lineItems: LineItem[]): number {
  let drawn = 0
  for (const item of lineItems) {
    for (const p of item.payments ?? []) {
      if (p.fundId === fundId) drawn += p.amount
    }
  }
  return Math.round(drawn * 100) / 100
}

export function fundDrawdown(
  fund: Fund,
  lineItems: LineItem[],
): { drawn: number; remaining: number; overdrawn: boolean } {
  const drawn = fundDrawn(fund.id, lineItems)
  const remaining = Math.round((fund.amount - drawn) * 100) / 100
  return { drawn, remaining, overdrawn: remaining < 0 }
}
