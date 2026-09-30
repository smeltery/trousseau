import type { Fund } from '../../db/types'
import { giftCoverageForCategory } from '../gift-coverage'

/** Gift coverage vs category budget envelope; positive gap = shortfall. */
export function earmarkShortfall(
  funds: Fund[],
  categoryId: string,
  categoryBudget: number,
): { covered: number; gap: number } {
  const covered = giftCoverageForCategory(funds, categoryId)
  if (categoryBudget <= 0 || covered <= 0) return { covered, gap: 0 }
  return { covered, gap: Math.max(0, categoryBudget - covered) }
}
