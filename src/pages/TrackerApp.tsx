import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AddExpenseDialog } from '../components/AddExpenseDialog'
import { BackupBar } from '../components/BackupBar'
import { CommandPalette } from '../components/command/CommandPalette'
import { TrackerFooter } from '../components/nav/TrackerFooter'
import { DueCalendar } from '../components/DueCalendar'
import { ExpenseGroups } from '../components/ExpenseGroups'
import { FundsSection } from '../components/funds/FundsSection'
import { LineItemSheet } from '../components/LineItemSheet'
import { PrintBudgetSummary } from '../components/expenses/PrintBudgetSummary'
import { OverviewHero } from '../components/OverviewHero'
import { Reveal } from '../components/Reveal'
import { db, loadDemoSample, resetToBlank } from '../db/dexie'
import { cloudBudgetStore, localBudgetStore } from '../lib/budget-store'
import { celebrate } from '../lib/celebrate'
import {
  clearRememberedShareToken,
  CLOUD_UPDATED_META,
  getActiveCloudToken,
  readRememberedShareToken,
} from '../lib/cloud/session'
import { goToSharedBudget } from '../lib/cloud/navigate'
import {
  ensureCloudBudget,
  enterCloudBudget,
  leaveCloudBudget,
} from '../lib/cloud/sync'
import { applyDocumentTitle } from '../lib/ux/document-title'
import { useCloudFocusAndUnload } from '../lib/ux/cloud-focus'
import { dbWrite } from '../lib/db-write'
import { expensesPaidTotal, expensesRunningTotal, orderedExpenseIds } from '../lib/expense-display'
import { isOverdue, todayKey, undatedUnpaidItems } from '../lib/calendar'
import { sum } from '../lib/money'
import { queueCelebrate, takePendingCelebrate } from '../lib/pending-celebrate'
import { showToast } from '../lib/toast'
import { noteCloudUpdatedAt } from '../lib/sync-status'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../lib/site-settings'
import { BootError, BootLoading, BootResumeChoice } from './BootScreen'
import { SkipToMain } from '../components/a11y/SkipToMain'

export function TrackerApp() {
  const { token: shareToken } = useParams<{ token?: string }>()
  const navigate = useNavigate()
  const cloudMode = Boolean(shareToken)
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [resumeChoice, setResumeChoice] = useState<string | null>(null)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addDueDate, setAddDueDate] = useState<string | undefined>()
  const [cmdOpen, setCmdOpen] = useState(false)
  const hydratedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
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
      setResumeChoice(null)
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
        const wantResume = searchParams.get('resume') === '1'

        if (wantImport) {
          navigate('/?import=1', { replace: true })
          return
        }

        if (!wantDemo && !wantNew) {
          const remembered = readRememberedShareToken()
          if (remembered) {
            if (wantResume) {
              goToSharedBudget(remembered, navigate)
              return
            }
            setResumeChoice(remembered)
            return
          }
        }

        if (wantDemo || wantNew) {
          setSearchParams({}, { replace: true })
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          })
          await leaveCloudBudget()
          clearRememberedShareToken()
          if (wantNew) {
            await dbWrite(() => resetToBlank())
            queueCelebrate('Blank budget ready')
          } else {
            await dbWrite(() => loadDemoSample())
            queueCelebrate('Demo sample loaded')
          }
        } else {
          await localBudgetStore.boot()
        }

        if (cancelled) return

        const share = await ensureCloudBudget()
        if (cancelled) return
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

  useCloudFocusAndUnload(ready, cloudMode)

  useEffect(() => {
    if (!ready) return
    const hash = window.location.hash
    if (hash !== '#backup' && hash !== '#calendar' && hash !== '#gift-summary' && hash !== '#expenses')
      return
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
  const categories = useLiveQuery(() => db.categories.orderBy('sort').toArray(), [ready]) ?? []
  const lineItems = useLiveQuery(() => db.lineItems.toArray(), [ready]) ?? []
  const attachments = useLiveQuery(() => db.attachments.toArray(), [ready]) ?? []
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [ready])
  const cloudUpdated = useLiveQuery(() => db.meta.get(CLOUD_UPDATED_META), [ready])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE

  useEffect(() => {
    if (!ready) return
    applyDocumentTitle(site.brandLeft, site.brandRight)
  }, [ready, site.brandLeft, site.brandRight])

  useEffect(() => {
    if (!ready || !cloudUpdated?.value) return
    noteCloudUpdatedAt(cloudUpdated.value)
  }, [ready, cloudUpdated?.value])

  const allocated = sum(funds.map((f) => f.amount))
  const spent = expensesPaidTotal(lineItems)
  const budgeted = expensesRunningTotal(categories, lineItems)
  const remaining = allocated - budgeted
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

  if (resumeChoice) {
    return (
      <BootResumeChoice
        onResume={() => goToSharedBudget(resumeChoice, navigate)}
        onStartNew={() => {
          setResumeChoice(null)
          navigate('/app?new=1', { replace: true })
          window.location.assign('/app?new=1')
        }}
        onDemo={() => {
          setResumeChoice(null)
          window.location.assign('/app?demo=1')
        }}
      />
    )
  }

  if (!ready) return <BootLoading />

  const shareUrl = cloudMode ? window.location.href : undefined
  const overdueCount = lineItems.filter((i) => isOverdue(i, todayKey())).length
  const undatedUnpaidCount = undatedUnpaidItems(lineItems).length
  const expenseSiblingIds = orderedExpenseIds(categories, lineItems)
  return (
    <div className="relative">
      <SkipToMain />
      <main id="main">
      <OverviewHero
        site={site}
        allocated={allocated}
        spent={spent}
        remaining={remaining}
        fundCount={funds.length}
        onAddExpense={() => {
          setAddDueDate(undefined)
          setAdding(true)
        }}
        onOpenCommands={() => setCmdOpen(true)}
        syncBanner={cloudMode}
        shareUrl={shareUrl}
        overdueCount={overdueCount}
        undatedUnpaidCount={undatedUnpaidCount}
      />
      <Reveal>
        <FundsSection site={site} funds={funds} syncBanner={cloudMode} />
      </Reveal>
      <Reveal delayMs={40}>
        <ExpenseGroups
          site={site}
          categories={categories}
          lineItems={lineItems}
          attachments={attachments}
          allocated={allocated}
          syncBanner={cloudMode}
          onOpenItem={setOpenItemId}
          onAddExpense={() => {
            setAddDueDate(undefined)
            setAdding(true)
          }}
        />
      </Reveal>
      <Reveal>
        <DueCalendar
          categories={categories}
          lineItems={lineItems}
          weddingDate={site.weddingDate} coupleNames={`${site.brandLeft} & ${site.brandRight}`}
          fundsLeft={remaining}
          syncBanner={cloudMode}
          onOpenItem={setOpenItemId}
          onAddExpense={(d) => {
            setAddDueDate(d)
            setAdding(true)
          }}
        />
      </Reveal>
      <Reveal>
        <BackupBar shareUrl={shareUrl} syncBanner={cloudMode} />
      </Reveal>
      <TrackerFooter />
      <PrintBudgetSummary
        site={site}
        funds={funds}
        categories={categories}
        lineItems={lineItems}
      />
      </main>

      {openItemId ? (
        <LineItemSheet
          lineItemId={openItemId}
          siblingIds={expenseSiblingIds}
          onClose={() => setOpenItemId(null)}
          onOpenItem={setOpenItemId}
        />
      ) : null}
      {adding ? (
        <AddExpenseDialog
          initialDueDate={addDueDate}
          onClose={() => {
            setAdding(false)
            setAddDueDate(undefined)
          }}
          onCreated={(id) => {
            setAdding(false)
            setAddDueDate(undefined)
            setOpenItemId(id)
          }}
        />
      ) : null}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        shareUrl={shareUrl}
        weddingDate={site.weddingDate}
        lineItems={lineItems}
        categories={categories}
        funds={funds}
        onAddExpense={() => {
          setAddDueDate(undefined)
          setAdding(true)
        }}
        onOpenItem={setOpenItemId}
      />
    </div>
  )
}
