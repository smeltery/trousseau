import type { LineItem, WhoPays } from '../../db/types'
import { db, newId } from '../../db/dexie'
import { todayKey } from '../calendar'
import { dbWrite } from '../db-write'
import { formatMoney } from '../money'
import type { SettleSide } from './who-pays-rollup'

export type NetSettlement = {
  fromKey: 'left' | 'right'
  toKey: 'left' | 'right'
  fromLabel: string
  toLabel: string
  amount: number
}

/** Net “A owes B $X” from per-side settle rows. */
export function netWhoPaysSettlement(sides: SettleSide[]): NetSettlement | null {
  const left = sides.find((s) => s.key === 'left')
  const right = sides.find((s) => s.key === 'right')
  if (!left || !right) return null
  const leftNet = left.paid - left.responsible
  const rightNet = right.paid - right.responsible
  if (leftNet > 0.005 && rightNet < -0.005) {
    return {
      fromKey: 'right',
      toKey: 'left',
      fromLabel: right.label,
      toLabel: left.label,
      amount: Math.round(Math.min(leftNet, -rightNet) * 100) / 100,
    }
  }
  if (rightNet > 0.005 && leftNet < -0.005) {
    return {
      fromKey: 'left',
      toKey: 'right',
      fromLabel: left.label,
      toLabel: right.label,
      amount: Math.round(Math.min(rightNet, -leftNet) * 100) / 100,
    }
  }
  return null
}

export function formatNetSettlement(net: NetSettlement): string {
  return `${net.fromLabel} owes ${net.toLabel} ${formatMoney(net.amount)}`
}

/** Append a Transfer stub documenting a settle-up payment between partners. */
export async function recordSettlementTransfer(
  items: LineItem[],
  net: NetSettlement,
): Promise<void> {
  const prefer = items.find(
    (i) =>
      i.whoPays === (net.fromKey as WhoPays) ||
      (net.fromKey === 'left' && (i.whoPaysLeft ?? 0) > 0),
  )
  const fallback = items.find(
    (i) => i.whoPays || i.whoPaysLeft != null || i.whoPaysRight != null,
  )
  const target = prefer ?? fallback
  if (!target) throw new Error('No who-pays expense to attach the transfer to')

  const stub = {
    id: newId('pay'),
    amount: net.amount,
    date: todayKey(),
    method: 'Transfer',
    note: `Settle: ${net.fromLabel} → ${net.toLabel}`,
  }
  const payments = [...(target.payments ?? []), stub]
  const paidAmount = Math.round((target.paidAmount + net.amount) * 100) / 100
  const status =
    target.amount > 0 && paidAmount >= target.amount ? ('paid' as const) : target.status

  await dbWrite(() =>
    db.lineItems.update(target.id, {
      payments,
      paidAmount,
      status,
    }),
  )
}
