import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { celebrate } from '../lib/celebrate'
import { goToSharedBudget } from '../lib/cloud/navigate'
import { pushCloudBudget } from '../lib/cloud/sync'
import {
  getPendingEditCount,
  getSyncStatus,
  setSyncStatus,
  subscribePendingEdits,
  subscribeSyncStatus,
  syncStatusLabel,
  type SyncStatus,
} from '../lib/sync-status'
import { showToast } from '../lib/toast'
import { useDialogFocus } from '../lib/use-dialog-focus'
import { ImportBackupDialog } from './ImportBackupDialog'
import { SyncBanner } from './nav/SyncBanner'
import { SiteNavMenu } from './SiteNavMenu'
import { TrousseauLogo } from './TrousseauLogo'

type SiteNavProps = {
  variant: 'marketing' | 'app'
  syncBanner?: boolean
  shareUrl?: string
  onOpenCommands?: () => void
  onAddExpense?: () => void
  overdueCount?: number
}

const navQuiet =
  'text-sm font-medium text-[var(--on-dark-muted)] transition-colors hover:text-[var(--on-dark)]'

const appSections = [
  { label: 'Gifts', href: '#gift-summary' },
  { label: 'Expenses', href: '#expenses' },
  { label: 'Calendar', href: '#calendar' },
  { label: 'Backup', href: '#backup' },
] as const

const marketingSections = [
  { label: 'How it works', href: '#how' },
  { label: 'Due dates', href: '#due' },
  { label: 'Privacy', href: '#privacy' },
] as const

const marketingSheetSections = [
  ...marketingSections,
  { label: 'Questions', href: '#questions' },
] as const

export function SiteNav({
  variant,
  syncBanner = false,
  shareUrl,
  onOpenCommands,
  onAddExpense,
  overdueCount = 0,
}: SiteNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [importRequested, setImportRequested] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [sync, setSync] = useState<SyncStatus>(() => getSyncStatus())
  const [pending, setPending] = useState(() => getPendingEditCount())
  const menuTitleId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const importFromQuery = variant === 'app' && searchParams.get('import') === '1'
  const importOpen = variant === 'app' && (importRequested || importFromQuery)

  useDialogFocus(menuRef, menuOpen)

  useEffect(() => subscribeSyncStatus(setSync), [])
  useEffect(() => subscribePendingEdits(setPending), [])

  useEffect(() => {
    function onOnline() {
      if (getSyncStatus() === 'offline') void pushCloudBudget()
    }
    function onOffline() {
      setSyncStatus('offline')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  function closeImport() {
    setImportRequested(false)
    if (!importFromQuery) return
    const next = new URLSearchParams(searchParams)
    next.delete('import')
    setSearchParams(next, { replace: true })
  }

  function jumpTo(href: string) {
    setMenuOpen(false)
    const id = href.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (href !== window.location.hash) window.history.replaceState(null, '', href)
    })
  }

  async function copyShare() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Share link copied')
    } catch {
      showToast(shareUrl)
    }
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const sheetClass = variant === 'marketing' ? 'lg:hidden' : 'md:hidden'
  const desktopSections = variant === 'marketing' ? marketingSections : appSections
  const sheetSections = variant === 'marketing' ? marketingSheetSections : appSections
  const homeTo = variant === 'app' ? `${location.pathname}${location.search}` : '/'
  const syncLabel = syncBanner ? syncStatusLabel(sync, pending) : null

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className={`fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] animate-[fade-in_0.2s_ease] ${sheetClass}`}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className={`fixed inset-x-0 top-0 ${menuOpen ? 'z-50' : 'z-30'}`}>
        <nav
          aria-label="Primary"
          className={`page-pad transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
            scrolled || syncBanner || menuOpen
              ? 'border-b border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--on-dark)_20%,transparent),0_10px_30px_color-mix(in_srgb,var(--grove)_30%,transparent)] backdrop-blur-xl backdrop-saturate-150'
              : 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none'
          }`}
        >
          <div className="page-shell flex min-h-14 items-center justify-between gap-4 py-3">
            <Link
              to={homeTo}
              onClick={(e) => {
                setMenuOpen(false)
                if (variant === 'app' || window.location.pathname === '/') {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  if (variant === 'marketing') window.history.replaceState(null, '', '/')
                }
              }}
              className="inline-flex translate-y-px items-center rounded-sm leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <TrousseauLogo
                onDark
                animateMark
                markClassName="h-7 w-auto"
                wordClassName="font-[family-name:var(--font-display)] text-2xl leading-none tracking-[-0.03em] text-[var(--on-dark)]"
              />
            </Link>

            <div
              className={`hidden items-center ${variant === 'marketing' ? 'gap-7 lg:flex' : 'gap-6 md:flex'}`}
            >
              {desktopSections.map((section) => (
                <a
                  key={section.href}
                  href={section.href}
                  className={navQuiet}
                  onClick={(e) => {
                    e.preventDefault()
                    jumpTo(section.href)
                  }}
                >
                  {section.label}
                </a>
              ))}
              {variant === 'app' && overdueCount > 0 ? (
                <a
                  href="#calendar"
                  className="text-sm font-semibold text-[var(--accent)] transition-colors hover:text-[var(--on-dark)]"
                  onClick={(e) => {
                    e.preventDefault()
                    jumpTo('#calendar')
                  }}
                >
                  {overdueCount} overdue
                </a>
              ) : null}
              {variant === 'marketing' ? (
                <>
                  <Link to="/?import=1" className={navQuiet}>
                    Import
                  </Link>
                  <Link to="/app?demo=1" className="btn-nav-demo">
                    Try demo
                  </Link>
                  <Link to="/app?new=1" className="btn-nav">
                    Start blank
                  </Link>
                </>
              ) : (
                <>
                  {shareUrl ? (
                    <button type="button" onClick={() => void copyShare()} className={navQuiet}>
                      Copy link
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCommands) onOpenCommands()
                      else window.dispatchEvent(new CustomEvent('trousseau:command'))
                    }}
                    className={navQuiet}
                    title="Command menu"
                  >
                    <kbd className="font-[family-name:var(--font-body)] text-[12px]">⌘K</kbd>
                  </button>
                  <button type="button" onClick={() => setImportRequested(true)} className="btn-nav">
                    Import
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              className={`nav-menu-toggle ${variant === 'marketing' ? 'lg:hidden' : 'md:hidden'}`}
              aria-expanded={menuOpen}
              aria-controls={menuTitleId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span aria-hidden className="nav-menu-bar" />
              <span aria-hidden className="nav-menu-bar" />
              <span aria-hidden className="nav-menu-bar" />
            </button>
          </div>
        </nav>
        {syncBanner ? (
          <SyncBanner
            syncLabel={syncLabel}
            sync={sync}
            shareUrl={shareUrl}
            onCopyShare={() => void copyShare()}
          />
        ) : null}

        {menuOpen ? (
          <div ref={menuRef}>
            <SiteNavMenu
              variant={variant}
              menuId={menuTitleId}
              sheetClass={sheetClass}
              sections={sheetSections}
              shareUrl={shareUrl}
              overdueCount={overdueCount}
              onJump={jumpTo}
              onClose={() => setMenuOpen(false)}
              onImport={() => {
                setMenuOpen(false)
                setImportRequested(true)
              }}
              onCopyShare={() => void copyShare()}
              onAddExpense={
                onAddExpense
                  ? () => {
                      setMenuOpen(false)
                      onAddExpense()
                    }
                  : undefined
              }
              onOpenCommands={() => {
                setMenuOpen(false)
                if (onOpenCommands) onOpenCommands()
                else window.dispatchEvent(new CustomEvent('trousseau:command'))
              }}
            />
          </div>
        ) : null}
      </div>

      {variant === 'app' && onAddExpense ? (
        <button
          type="button"
          onClick={onAddExpense}
          className="btn-primary fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 shadow-[0_12px_28px_color-mix(in_srgb,var(--grove)_35%,transparent)] md:hidden"
        >
          Add expense
        </button>
      ) : null}

      {importOpen ? (
        <ImportBackupDialog
          onClose={closeImport}
          onImported={(share) => {
            if (share) {
              showToast('Imported: share link copied')
              celebrate()
              goToSharedBudget(share.token, navigate)
            } else {
              showToast('Import needs a share link. Try again.')
            }
          }}
        />
      ) : null}
    </>
  )
}
