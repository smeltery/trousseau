import type { Fund } from '../../db/types'
import { sum } from '../money'

/** Months (fractional) from today to wedding; null if no future wedding. */
export function monthsToWedding(weddingDate: string | undefined, today: string): number | null {
  if (!weddingDate || weddingDate < today) return null
  const days = Math.round(
    (new Date(`${weddingDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) /
      86400000,
  )
  return Math.max(1 / 30.44, days / 30.44)
}

/** Savings contribution pace toward a wedding-date target. */
export function savingsContributionPace(
  funds: Fund[],
  targetAmount: number,
  weddingDate: string | undefined,
  today: string,
): {
  saved: number
  remaining: number
  months: number
  monthlyPace: number
  onTrack: boolean
} | null {
  if (!(targetAmount > 0)) return null
  const months = monthsToWedding(weddingDate, today)
  if (months == null) return null
  const saved = sum(funds.filter((f) => f.type === 'savings').map((f) => f.amount))
  const remaining = Math.max(0, targetAmount - saved)
  const monthlyPace = remaining / months
  return {
    saved,
    remaining,
    months,
    monthlyPace,
    onTrack: remaining <= 0,
  }
}
