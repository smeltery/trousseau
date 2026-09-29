import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { clearRememberedShareToken, getActiveCloudToken, readRememberedShareToken } from '../lib/cloud/session'
import { goToSharedBudget } from '../lib/cloud/navigate'
import {
  ensureCloudBudget,
  enterCloudBudget,
  leaveCloudBudget,
  pullCloudBudgetIfStale,
} from '../lib/cloud/sync'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { sum } from '../lib/money'
import { queueCelebrate, takePendingCelebrate } from '../lib/pending-celebrate'
import { showToast } from '../lib/toast'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../lib/site-settings'
import { BootError, BootLoading } from './BootScreen'

export function TrackerApp() {
  const { token: shareToken } = useParams<{ token?: string }>()
  const navigate = useNavigate()
  const cloudMode = Boolean(shareToken)
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const hydratedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      // Soft handoff: already activated for this token (publish or prior boot).
      if (
        shareToken &&
        (hydratedTokenRef.current === shareToken || getActiveCloudToken() === shareToken)
      ) {
        hydratedTokenRef.current = shareToken
        setReady(true)
        return
      }

      setBootError(null)
      setReady(false)
      setAwaitingConfirm(false)
      try {
        if (shareToken) {
          await cloudBudgetStore.boot(shareToken)
          if (cancelled) return
          hydratedTokenRef.current = shareToken
          setReady(true)
          return
        }

        const wantImport = searchParams.get('import') === '1'
        const wantDemo = searchParams.get('demo') === '1'
        const wantNew = searchParams.get('new') === '1'

        // Import lives on the marketing home so cancel stays there.
        if (wantImport) {
          navigate('/?import=1', { replace: true })
          return
        }

        // Resume: jump straight to the share URL instead of waiting on /app.
        if (!wantDemo && !wantNew) {
          const remembered = readRememberedShareToken()
          if (remembered) {
            goToSharedBudget(remembered, navigate)
            return
          }
        }

        if (wantDemo || wantNew) {
          setSearchParams({}, { replace: true })
          if (wantNew) {
            setAwaitingConfirm(true)
            const ok = await askConfirm({
              title: 'Start a blank budget?',
              body: 'This replaces your current budget and opens a new share link.',
              confirmLabel: 'Start blank',
              danger: true,
            })
            if (cancelled) return
            setAwaitingConfirm(false)
            if (!ok) {
              // Resume existing share below.
            } else {
              await leaveCloudBudget()
              clearRememberedShareToken()
              await dbWrite(() => resetToBlank())
              queueCelebrate('Blank budget ready')
            }
          } else {
            await leaveCloudBudget()
            clearRememberedShareToken()
            await dbWrite(() => loadDemoSample())
            queueCelebrate('Demo sample loaded')
          }
        } else {
          await localBudgetStore.boot()
        }

        if (cancelled) return

        const share = await ensureCloudBudget()
        if (cancelled) return
        // Activate on local data, then soft-route so we don't remount into BootShell.
        await enterCloudBudget(share.token)
        if (cancelled) return
        hydratedTokenRef.current = share.token
        setReady(true)
        goToSharedBudget(share.token, navigate)
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
    if (!ready) return
    const message = takePendingCelebrate()
    if (!message) return
    showToast(message)
    celebrate()
  }, [ready])

  useEffect(() => {
    if (!ready || !cloudMode) return
    async function onFocus() {
      try {
        const changed = await pullCloudBudgetIfStale()
        if (changed) showToast('Shared budget updated')
      } catch {
        // Offline / transient: keep local cache.
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
      showToast('Over budget: add funds or trim expenses')
    }
    prevRemaining.current = remaining
  }, [ready, remaining])

  if (bootError) return <BootError message={bootError} />

  if (!ready) return <BootLoading awaitingConfirm={awaitingConfirm} />

  return (
    <div className="relative">
      <OverviewHero
        site={site}
        allocated={allocated}
        spent={spent}
        remaining={remaining}
        onAddExpense={() => setAdding(true)}
        syncBanner={cloudMode}
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
        <BackupBar shareUrl={cloudMode ? window.location.href : undefined} />
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
