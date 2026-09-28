import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AddExpenseDialog } from '../components/AddExpenseDialog'
import { BackupBar } from '../components/BackupBar'
import { ExpenseGroups } from '../components/ExpenseGroups'
import { FundsSection } from '../components/FundsSection'
import { LineItemSheet } from '../components/LineItemSheet'
import { OverviewHero } from '../components/OverviewHero'
import { SiteNav } from '../components/SiteNav'
import { ensureSeeded, db, loadDemoSample } from '../db/dexie'
import { sum } from '../lib/money'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../lib/site-settings'

export function TrackerApp() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const wantDemo = searchParams.get('demo') === '1'
      if (wantDemo) {
        // Clear immediately so React Strict Mode remounts don't double-prompt.
        setSearchParams({}, { replace: true })
        const ok = confirm(
          'Load the filled demo sample? This replaces any budget data already in this browser.',
        )
        if (cancelled) return
        if (ok) await loadDemoSample()
        else await ensureSeeded()
        if (!cancelled) setReady(true)
        return
      }
      await ensureSeeded()
      if (!cancelled) setReady(true)
    }
    void boot()
    return () => {
      cancelled = true
    }
    // Only on first mount — demo query is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const funds = useLiveQuery(() => db.funds.toArray(), [ready]) ?? []
  const categories = useLiveQuery(() => db.categories.toArray(), [ready]) ?? []
  const lineItems = useLiveQuery(() => db.lineItems.toArray(), [ready]) ?? []
  const attachments = useLiveQuery(() => db.attachments.toArray(), [ready]) ?? []
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [ready])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE

  const allocated = sum(funds.map((f) => f.amount))
  const spent = sum(lineItems.map((i) => i.paidAmount))
  const remaining = allocated - spent

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--ink-muted)]">
        Loading…
      </div>
    )
  }

  return (
    <div className="relative pb-8">
      <SiteNav variant="app" />

      <OverviewHero
        site={site}
        allocated={allocated}
        spent={spent}
        remaining={remaining}
        onAddExpense={() => setAdding(true)}
      />
      <FundsSection site={site} funds={funds} />
      <ExpenseGroups
        site={site}
        categories={categories}
        lineItems={lineItems}
        attachments={attachments}
        onOpenItem={setOpenItemId}
        onAddExpense={() => setAdding(true)}
      />
      <BackupBar />

      {openItemId ? (
        <LineItemSheet lineItemId={openItemId} onClose={() => setOpenItemId(null)} />
      ) : null}
      {adding ? (
        <AddExpenseDialog
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false)
            setOpenItemId(id)
          }}
        />
      ) : null}
    </div>
  )
}
