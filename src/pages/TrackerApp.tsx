import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AddExpenseDialog } from '../components/AddExpenseDialog'
import { BackupBar } from '../components/BackupBar'
import { DueCalendar } from '../components/DueCalendar'
import { ExpenseGroups } from '../components/ExpenseGroups'
import { FundsSection } from '../components/FundsSection'
import { LineItemSheet } from '../components/LineItemSheet'
import { OverviewHero } from '../components/OverviewHero'
import { Reveal } from '../components/Reveal'
import { db, loadDemoSample, resetToBlank } from '../db/dexie'
import { cloudBudgetStore, localBudgetStore } from '../lib/budget-store'
import { celebrate } from '../lib/celebrate'
import { pullCloudBudgetIfStale } from '../lib/cloud/sync'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { sum } from '../lib/money'
import { showToast } from '../lib/toast'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../lib/site-settings'

export function TrackerApp() {
  const { token: shareToken } = useParams<{ token?: string }>()
  const cloudMode = Boolean(shareToken)
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setBootError(null)
      setReady(false)
      try {
        if (shareToken) {
          await cloudBudgetStore.boot(shareToken)
          if (!cancelled) setReady(true)
          return
        }

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
              celebrate()
            } else await localBudgetStore.boot()
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
              celebrate()
            } else await localBudgetStore.boot()
          }
          if (!cancelled) setReady(true)
          return
        }

        await localBudgetStore.boot()
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) {
          setBootError(err instanceof Error ? err.message : 'Could not open budget')
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken])

  useEffect(() => {
    if (!ready || !cloudMode) return
    async function onFocus() {
      try {
        const changed = await pullCloudBudgetIfStale()
        if (changed) showToast('Shared budget updated')
      } catch {
        // Offline / transient — keep local cache.
      }
    }
    function onVis() {
      if (document.visibilityState === 'visible') void onFocus()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ready, cloudMode])

  useEffect(() => {
    if (!ready) return
    const hash = window.location.hash
    if (hash !== '#backup' && hash !== '#calendar') return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const prevRemaining = useRef<number | null>(null)

  useEffect(() => {
    if (!ready) return
    const prev = prevRemaining.current
    if (prev !== null && prev >= 0 && remaining < 0) {
      showToast('Over budget — add funds or trim expenses')
    }
    prevRemaining.current = remaining
  }, [ready, remaining])

  if (bootError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--grove)] page-pad text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--on-dark)]">
          Shared budget unavailable
        </p>
        <p className="max-w-md text-sm text-[var(--on-dark-muted)]">{bootError}</p>
        <a href="/app" className="btn-nav">
          Open local tracker
        </a>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--grove)] page-pad">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--on-dark)] animate-[fade-in_0.5s_ease]">
          Trousseau
        </p>
        <p className="text-sm tracking-[0.08em] text-[var(--on-dark-muted)] animate-[fade-in_0.7s_ease]">
          {cloudMode ? 'Opening shared budget…' : 'Opening your budget…'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {cloudMode ? (
        <div className="sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_88%,transparent)] px-[var(--page-pad)] py-2.5 text-center backdrop-blur-md">
          <p className="text-sm text-[var(--on-dark-muted)]">
            Shared budget · anyone with this link can edit. Treat the URL like a password.
          </p>
        </div>
      ) : null}
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
        <DueCalendar
          categories={categories}
          lineItems={lineItems}
          onOpenItem={setOpenItemId}
        />
      </Reveal>
      <Reveal>
        <BackupBar cloudMode={cloudMode} shareUrl={cloudMode ? window.location.href : undefined} />
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
