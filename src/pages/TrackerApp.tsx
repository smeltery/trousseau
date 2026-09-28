import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AddExpenseDialog } from '../components/AddExpenseDialog'
import { BackupBar } from '../components/BackupBar'
import { ExpenseGroups } from '../components/ExpenseGroups'
import { FundsSection } from '../components/FundsSection'
import { LineItemSheet } from '../components/LineItemSheet'
import { OverviewHero } from '../components/OverviewHero'
import { Reveal } from '../components/Reveal'
import { ensureSeeded, db, loadDemoSample, resetToBlank } from '../db/dexie'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { sum } from '../lib/money'
import { showToast } from '../lib/toast'
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
      const wantNew = searchParams.get('new') === '1'

      if (wantDemo || wantNew) {
        setSearchParams({}, { replace: true })
        if (wantNew) {
          const ok = await askConfirm({
            title: 'Start a blank budget?',
            body: 'This replaces any budget data already in this browser.',
            confirmLabel: 'Start blank',
            danger: true,
          })
          if (cancelled) return
          if (ok) {
            await dbWrite(() => resetToBlank())
            showToast('Blank budget ready')
          } else await ensureSeeded()
        } else {
          const ok = await askConfirm({
            title: 'Load the filled demo?',
            body: 'This replaces any budget data already in this browser.',
            confirmLabel: 'Load demo',
            danger: true,
          })
          if (cancelled) return
          if (ok) {
            await dbWrite(() => loadDemoSample())
            showToast('Demo sample loaded')
          } else await ensureSeeded()
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    if (window.location.hash !== '#backup') return
    document.getElementById('backup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [ready])

  useEffect(() => {
    if (!ready) return
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setAdding(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready])

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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--grove)] page-pad">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--on-dark)] animate-[fade-in_0.5s_ease]">
          Trousseau
        </p>
        <p className="text-sm tracking-[0.08em] text-[var(--on-dark-muted)] animate-[fade-in_0.7s_ease]">
          Opening your budget…
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <OverviewHero
        site={site}
        allocated={allocated}
        spent={spent}
        remaining={remaining}
        onAddExpense={() => setAdding(true)}
      />
      <Reveal>
        <FundsSection site={site} funds={funds} />
      </Reveal>
      <Reveal delayMs={40}>
        <ExpenseGroups
          site={site}
          categories={categories}
          lineItems={lineItems}
          attachments={attachments}
          allocated={allocated}
          onOpenItem={setOpenItemId}
          onAddExpense={() => setAdding(true)}
        />
      </Reveal>
      <Reveal>
        <BackupBar />
      </Reveal>

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
