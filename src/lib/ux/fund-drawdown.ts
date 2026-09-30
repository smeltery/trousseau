import type { Fund, FundType, LineItem } from '../../db/types'
import { db, newId } from '../../db/dexie'
import { todayKey } from '../calendar'
import { dbWrite } from '../db-write'

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

/**
 * Liquid cash available: savings + received gifts − payment draws.
 * Promised (unreceived) gifts are excluded so runway isn’t fake-rich.
 */
export function liquidCash(funds: Fund[], lineItems: LineItem[]): {
  liquid: number
  drawn: number
  promisedExcluded: number
} {
  let liquid = 0
  let promisedExcluded = 0
  let drawn = 0
  for (const f of funds) {
    if (f.type === 'gift' && !f.receivedDate) {
      promisedExcluded += f.amount
      continue
    }
    liquid += f.amount
    drawn += fundDrawn(f.id, lineItems)
  }
  return {
    liquid: Math.round((liquid - drawn) * 100) / 100,
    drawn: Math.round(drawn * 100) / 100,
    promisedExcluded: Math.round(promisedExcluded * 100) / 100,
  }
}

/** Clear payment fundId refs that point at a fund about to be deleted. */
export async function cascadeFundIdOnDelete(fundId: string): Promise<number> {
  const items = await db.lineItems.toArray()
  let cleared = 0
  await dbWrite(async () => {
    for (const item of items) {
      const payments = item.payments
      if (!payments?.some((p) => p.fundId === fundId)) continue
      const next = payments.map((p) =>
        p.fundId === fundId ? { ...p, fundId: undefined } : p,
      )
      cleared += payments.filter((p) => p.fundId === fundId).length
      await db.lineItems.update(item.id, { payments: next })
    }
    await db.funds.delete(fundId)
  })
  return cleared
}

/** Credit a reimbursement amount onto an existing or new fund; mark backReceived. */
export async function creditRefundToFund(opts: {
  item: LineItem
  amount: number
  fundId: string | '__new_savings__' | '__new_gift__'
  funds: Fund[]
}): Promise<string> {
  const { item, amount, fundId, funds } = opts
  if (!(amount > 0)) throw new Error('Nothing to credit')

  if (fundId === '__new_savings__' || fundId === '__new_gift__') {
    const type: FundType = fundId === '__new_gift__' ? 'gift' : 'savings'
    const peers = funds.filter((f) => f.type === type)
    const sort = peers.length === 0 ? 0 : Math.max(...peers.map((f) => f.sort), 0) + 1
    const id = newId('fund')
    await dbWrite(async () => {
      await db.funds.add({
        id,
        label: item.label,
        amount,
        type,
        sort,
        receivedDate: todayKey(),
      })
      await db.lineItems.update(item.id, { backReceived: true })
    })
    return type === 'gift' ? 'Added as gift fund' : 'Added as savings fund'
  }

  const fund = funds.find((f) => f.id === fundId)
  if (!fund) throw new Error('Choose a fund')
  await dbWrite(async () => {
    await db.funds.update(fund.id, {
      amount: Math.round((fund.amount + amount) * 100) / 100,
    })
    await db.lineItems.update(item.id, { backReceived: true })
  })
  return `Credited ${fund.label}`
}
