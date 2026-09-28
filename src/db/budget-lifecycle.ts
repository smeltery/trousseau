import { db } from './dexie'
import {
  blankCategories,
  blankFunds,
  blankLineItems,
  demoCategories,
  demoFunds,
  demoLineItems,
} from './seed'
import { DEFAULT_SITE, DEMO_SITE, SITE_META_KEY } from '../lib/site-settings'

const SEEDED_KEY = 'seeded'

async function replaceBudget(opts: {
  funds: typeof blankFunds
  categories: typeof blankCategories
  lineItems: typeof blankLineItems
  site: typeof DEFAULT_SITE
}): Promise<void> {
  await db.transaction(
    'rw',
    db.funds,
    db.categories,
    db.lineItems,
    db.attachments,
    db.meta,
    async () => {
      await Promise.all([
        db.funds.clear(),
        db.categories.clear(),
        db.lineItems.clear(),
        db.attachments.clear(),
        db.meta.clear(),
      ])
      if (opts.funds.length) await db.funds.bulkAdd(opts.funds)
      if (opts.categories.length) await db.categories.bulkAdd(opts.categories)
      if (opts.lineItems.length) await db.lineItems.bulkAdd(opts.lineItems)
      await db.meta.put({ key: SITE_META_KEY, value: JSON.stringify(opts.site) })
      await db.meta.put({ key: SEEDED_KEY, value: new Date().toISOString() })
    },
  )
}

export async function ensureSeeded(): Promise<void> {
  const seeded = await db.meta.get(SEEDED_KEY)
  if (!seeded) {
    await db.transaction('rw', db.funds, db.categories, db.lineItems, db.meta, async () => {
      const count = await db.funds.count()
      const catCount = await db.categories.count()
      if (count === 0 && catCount === 0) {
        if (blankFunds.length) await db.funds.bulkAdd(blankFunds)
        await db.categories.bulkAdd(blankCategories)
        if (blankLineItems.length) await db.lineItems.bulkAdd(blankLineItems)
      }
      await db.meta.put({ key: SITE_META_KEY, value: JSON.stringify(DEFAULT_SITE) })
      await db.meta.put({ key: SEEDED_KEY, value: new Date().toISOString() })
    })
    return
  }

  const site = await db.meta.get(SITE_META_KEY)
  if (!site) {
    await db.meta.put({ key: SITE_META_KEY, value: JSON.stringify(DEFAULT_SITE) })
  }
}

/** Wipe local data and start a fresh blank tracker. */
export async function resetToBlank(): Promise<void> {
  await replaceBudget({
    funds: blankFunds,
    categories: blankCategories,
    lineItems: blankLineItems,
    site: DEFAULT_SITE,
  })
}

/** Load the filled demo sample (for marketing “Try demo”). */
export async function loadDemoSample(): Promise<void> {
  await replaceBudget({
    funds: demoFunds,
    categories: demoCategories,
    lineItems: demoLineItems,
    site: DEMO_SITE,
  })
}

/** @deprecated Use resetToBlank */
export async function resetToSeed(): Promise<void> {
  await resetToBlank()
}
