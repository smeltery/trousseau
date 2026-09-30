import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { celebrate } from '../lib/celebrate'
import { goToSharedBudget } from '../lib/cloud/navigate'
import { showToast } from '../lib/toast'
import { ImportBackupDialog } from './ImportBackupDialog'
import { SiteNavMenu } from './SiteNavMenu'
import { TrousseauLogo } from './TrousseauLogo'

type SiteNavProps = {
  variant: 'marketing' | 'app'
  /** Show the share/sync notice under the bar (app only). */
  syncBanner?: boolean
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

export function SiteNav({ variant, syncBanner = false }: SiteNavProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [importRequested, setImportRequested] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuTitleId = useId()
  const importFromQuery = variant === 'app' && searchParams.get('import') === '1'
  const importOpen = variant === 'app' && (importRequested || importFromQuery)

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
    // Defer so the sheet can close before scrolling on mobile.
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (href !== window.location.hash) {
        window.history.replaceState(null, '', href)
      }
    })
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
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const sheetClass = variant === 'marketing' ? 'lg:hidden' : 'md:hidden'
  const desktopSections = variant === 'marketing' ? marketingSections : appSections
  const sheetSections = variant === 'marketing' ? marketingSheetSections : appSections

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
          <div className="page-shell flex items-center justify-between gap-4 py-4">
            <Link
              to="/"
              onClick={(e) => {
                setMenuOpen(false)
                if (window.location.pathname === '/') {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  window.history.replaceState(null, '', '/')
                }
              }}
              className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <TrousseauLogo
                onDark
                animateMark
                markClassName="h-7 w-auto"
                wordClassName="font-[family-name:var(--font-display)] text-2xl leading-none tracking-[-0.03em] text-[var(--on-dark)]"
              />
            </Link>

            <div
              className={`hidden items-center ${variant === 'marketing' ? 'gap-7 lg:flex' : 'gap-8 md:flex'}`}
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
                <button type="button" onClick={() => setImportRequested(true)} className="btn-nav">
                  Import
                </button>
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
          <div className="border-b border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_88%,transparent)] px-[var(--page-pad)] py-2.5 text-center backdrop-blur-md">
            <p className="text-sm text-[var(--on-dark-muted)]">
              Synced budget · anyone with this link can edit. Treat the URL like a password.
            </p>
          </div>
        ) : null}

        {menuOpen ? (
          <SiteNavMenu
            variant={variant}
            menuId={menuTitleId}
            sheetClass={sheetClass}
            sections={sheetSections}
            onJump={jumpTo}
            onClose={() => setMenuOpen(false)}
            onImport={() => {
              setMenuOpen(false)
              setImportRequested(true)
            }}
          />
        ) : null}
      </div>

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
