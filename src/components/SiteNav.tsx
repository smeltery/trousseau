import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { celebrate } from '../lib/celebrate'
import { goToSharedBudget } from '../lib/cloud/navigate'
import { showToast } from '../lib/toast'
import { ImportBackupDialog } from './ImportBackupDialog'
import { TrousseauLogo } from './TrousseauLogo'

type SiteNavProps = {
  variant: 'marketing' | 'app'
  /** Show the share/sync notice under the bar (app only). */
  syncBanner?: boolean
}

const navQuiet =
  'text-sm font-medium text-[var(--on-dark-muted)] transition-colors hover:text-[var(--on-dark)]'

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

  function openImport() {
    setMenuOpen(false)
    setImportRequested(true)
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

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30">
        <nav
          aria-label="Primary"
          className={`page-pad transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
            scrolled || syncBanner
              ? 'border-b border-[color-mix(in_srgb,var(--on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--on-dark)_20%,transparent),0_10px_30px_color-mix(in_srgb,var(--grove)_30%,transparent)] backdrop-blur-xl backdrop-saturate-150'
              : 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none'
          }`}
        >
        <div className="page-shell flex items-center justify-between gap-4 py-4">
          <Link
            to="/"
            className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <TrousseauLogo
              onDark
              markClassName="h-7 w-[36px]"
              wordClassName="font-[family-name:var(--font-display)] text-2xl leading-none tracking-[-0.03em] text-[var(--on-dark)]"
              className="gap-3"
            />
          </Link>

          {variant === 'marketing' ? (
            <div className="hidden items-center gap-5 md:flex">
              <Link to="/?import=1" className={navQuiet}>
                Import
              </Link>
              <Link to="/app?demo=1" className="btn-nav-demo">
                Try demo
              </Link>
              <Link to="/app?new=1" className="btn-nav">
                Start blank
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-7 md:flex">
              <Link to="/" className={navQuiet}>
                About
              </Link>
              <a href="#calendar" className={navQuiet}>
                Calendar
              </a>
              <a href="#backup" className={navQuiet}>
                Backup
              </a>
              <button type="button" onClick={() => setImportRequested(true)} className="btn-nav">
                Import
              </button>
            </div>
          )}

          <button
            type="button"
            className="nav-menu-toggle md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuTitleId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden className={`nav-menu-bar ${menuOpen ? 'translate-y-[5px] rotate-45' : ''}`} />
            <span aria-hidden className={`nav-menu-bar ${menuOpen ? 'opacity-0' : ''}`} />
            <span aria-hidden className={`nav-menu-bar ${menuOpen ? '-translate-y-[5px] -rotate-45' : ''}`} />
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
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] animate-[fade-in_0.2s_ease]"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={menuTitleId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 border-b border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)] bg-[color-mix(in_srgb,var(--grove)_78%,transparent)] px-[var(--page-pad)] pt-8 pb-10 shadow-[var(--sheet-shadow)] backdrop-blur-2xl backdrop-saturate-150 animate-[drop-in_0.3s_var(--ease-out)]"
          >
            <div className="page-shell">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className={navQuiet}
                >
                  Close
                </button>
              </div>

              {variant === 'marketing' ? (
                <div className="mt-10 flex flex-col gap-4">
                  <Link
                    to="/app?new=1"
                    className="btn-nav w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    Start blank
                  </Link>
                  <Link
                    to="/app?demo=1"
                    className="btn-nav-demo w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    Try demo
                  </Link>
                  <Link
                    to="/?import=1"
                    onClick={() => setMenuOpen(false)}
                    className="w-full py-3 text-center text-sm font-medium text-[var(--on-dark-muted)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)]"
                  >
                    Import backup
                  </Link>
                </div>
              ) : (
                <div className="mt-10 flex flex-col gap-4">
                  <button type="button" onClick={openImport} className="btn-nav w-full">
                    Import backup
                  </button>
                  <a
                    href="#calendar"
                    className="btn-nav-demo w-full text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Calendar
                  </a>
                  <a
                    href="#backup"
                    className="w-full py-3 text-center text-sm font-medium text-[var(--on-dark-muted)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Backup
                  </a>
                  <Link
                    to="/"
                    className="w-full py-3 text-center text-sm font-medium text-[var(--on-dark-muted)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    About Trousseau
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
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
