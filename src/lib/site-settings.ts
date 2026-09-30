import { db } from '../db/dexie'
import type { CategoryGroup } from '../db/types'
import { scheduleCloudPush } from './cloud/sync'

export const SITE_META_KEY = 'site'

export interface SiteSettings {
  heroEyebrow: string
  brandLeft: string
  brandRight: string
  /** Optional YYYY-MM-DD wedding day for countdown + calendar context. */
  weddingDate?: string
  fundsEyebrow: string
  fundsTitle: string
  fundsSub: string
  giftColumn: string
  savingsColumn: string
  expensesEyebrow: string
  expensesTitle: string
  expensesSub: string
  groupLabels: Record<CategoryGroup, string>
}

export const DEFAULT_SITE: SiteSettings = {
  heroEyebrow: 'Wedding budget',
  brandLeft: 'Groom',
  brandRight: 'Bride',
  fundsEyebrow: 'Where it comes from',
  fundsTitle: 'Gift Summary',
  fundsSub: 'Gifts and wedding savings that make up your allocated total.',
  giftColumn: 'Gift Source',
  savingsColumn: 'Wedding Savings',
  expensesEyebrow: 'Where it goes',
  expensesTitle: 'Expenses',
  expensesSub: 'Open a line to add notes, invoices, or receipts. Customize categories as you go.',
  groupLabels: {
    venue: 'Venue Expenses',
    vendor: 'Vendors / Additional',
    reimbursement: 'Items to be Reimbursed',
  },
}

/** @deprecated Prefer buildDemoSample() for couple names — kept for older call sites. */
export const DEMO_SITE: SiteSettings = {
  ...DEFAULT_SITE,
  brandLeft: 'Alex',
  brandRight: 'Jordan',
  fundsSub: 'Sample gifts and savings so you can explore the layout before using your own numbers.',
}

export function parseSiteSettings(raw: string | undefined): SiteSettings {
  if (!raw) return { ...DEFAULT_SITE, groupLabels: { ...DEFAULT_SITE.groupLabels } }
  try {
    const parsed = JSON.parse(raw) as Partial<SiteSettings>
    return {
      ...DEFAULT_SITE,
      ...parsed,
      weddingDate: parsed.weddingDate || undefined,
      groupLabels: {
        ...DEFAULT_SITE.groupLabels,
        ...(parsed.groupLabels ?? {}),
      },
    }
  } catch {
    return { ...DEFAULT_SITE, groupLabels: { ...DEFAULT_SITE.groupLabels } }
  }
}

export async function saveSiteSettings(next: SiteSettings): Promise<void> {
  await db.meta.put({ key: SITE_META_KEY, value: JSON.stringify(next) })
  scheduleCloudPush()
}

export async function patchSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  const row = await db.meta.get(SITE_META_KEY)
  const current = parseSiteSettings(row?.value)
  const next: SiteSettings = {
    ...current,
    ...patch,
    groupLabels: {
      ...current.groupLabels,
      ...(patch.groupLabels ?? {}),
    },
  }
  await saveSiteSettings(next)
}
