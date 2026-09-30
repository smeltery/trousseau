import type { LineItem } from '../../db/types'
import { cashDueThisMonth, cashDueThisWeek } from '../../lib/calendar'
import { formatMoney } from '../../lib/money'

/** Compact cash-due totals for the calendar header / agenda. */
export function CashDueStrip({ items, today }: { items: LineItem[]; today: string }) {
  const week = cashDueThisWeek(items, today)
  const month = cashDueThisMonth(items, today)
  if (week <= 0 && month <= 0) return null
  return (
    <p className="text-sm text-[var(--ink-muted)]">
      {week > 0 ? (
        <>
          <span className="font-semibold text-[var(--accent-deep)]">Cash due this week · </span>
          {formatMoney(week)}
        </>
      ) : null}
      {week > 0 && month > 0 ? <span className="text-[var(--ink-faint)]"> · </span> : null}
      {month > 0 ? (
        <>
          <span className="font-semibold text-[var(--accent-deep)]">
            {week > 0 ? 'this month · ' : 'Cash due this month · '}
          </span>
          {formatMoney(month)}
        </>
      ) : null}
    </p>
  )
}
