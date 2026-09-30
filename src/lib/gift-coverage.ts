import type { Fund } from '../db/types'
import { sum } from './money'

/** Sum of gifts earmarked to a category. */
export function giftCoverageForCategory(funds: Fund[], categoryId: string): number {
  return sum(
    funds.filter((f) => f.type === 'gift' && f.earmarkCategoryId === categoryId).map((f) => f.amount),
  )
}
