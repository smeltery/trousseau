import type { WhoPays } from '../../db/types'
import type { SiteSettings } from '../../lib/site-settings'

/** Display label for whoPays using couple brand names. */
export function whoPaysLabel(
  whoPays: WhoPays | undefined,
  site: Pick<SiteSettings, 'brandLeft' | 'brandRight'>,
): string | null {
  if (!whoPays) return null
  if (whoPays === 'joint') return 'Joint'
  if (whoPays === 'left') return site.brandLeft.trim() || 'Left'
  if (whoPays === 'right') return site.brandRight.trim() || 'Right'
  return null
}
