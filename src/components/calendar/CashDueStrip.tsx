import type { LineItem } from '../../db/types'
import { cashDueThisMonth, cashDueThisWeek, cashRunway } from '../../lib/calendar'
import { formatMoney } from '../../lib/money'

/** Compact cash-due totals for the calendar header / agenda. */
export function CashDueStrip({
  items,
  today,
  weddingDate,
  fundsLeft,
}: {
  items: LineItem[]
  today: string
  weddingDate?: string
  fundsLeft?: number
}) {
  const week = cashDueThisWeek(items, today)
  const month = cashDueThisMonth(items, today)
  const runway =
    fundsLeft != null ? cashRunway(items, fundsLeft, weddingDate, today) : null
  if (week <= 0 && month <= 0 && !runway) return null
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
      {runway ? (
        <>
          {week > 0 || month > 0 ? <span className="text-[var(--ink-faint)]"> · </span> : null}
          <span className="font-semibold text-[var(--accent-deep)]">Before wedding · </span>
          {formatMoney(runway.duesBeforeWedding)} dues vs {formatMoney(runway.fundsLeft)} left
          {runway.months > 1 ? <> · ~{formatMoney(runway.monthlyPace)}/mo</> : null}
        </>
      ) : null}
    </p>
  )
}
