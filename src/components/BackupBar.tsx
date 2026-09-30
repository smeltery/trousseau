import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { downloadBackupZip } from '../lib/backup-actions'
import { celebrate } from '../lib/celebrate'
import { askConfirm } from '../lib/confirm'
import { goToSharedBudget } from '../lib/cloud/navigate'
import { replaceBudgetAndShare } from '../lib/replace-budget'
import { showToast } from '../lib/toast'
import { ImportBackupDialog } from './ImportBackupDialog'

const linkAction =
  'text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50'
const linkQuiet =
  'text-sm font-medium tracking-wide text-[var(--ink-faint)] underline decoration-1 underline-offset-5 hover:text-[var(--ink-muted)] disabled:cursor-not-allowed disabled:opacity-50'

/** Tracker backup: export, import, share link, blank/demo. */
export function BackupBar({ shareUrl }: { shareUrl?: string }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  async function onExport() {
    setBusy(true)
    try {
      await downloadBackupZip()
      showToast('Backup downloaded')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  async function onCopyShare() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Share link copied')
    } catch {
      showToast(shareUrl)
    }
  }

  async function replaceAndShare(kind: 'blank' | 'demo') {
    const ok = await askConfirm({
      title: kind === 'blank' ? 'Start a blank budget?' : 'Load the demo sample?',
      body:
        'This replaces your current budget and creates a new share link. Export a backup first if you want to keep this one.',
      confirmLabel: kind === 'blank' ? 'Start blank' : 'Load demo',
      danger: true,
    })
    if (!ok) return

    setBusy(true)
    try {
      await replaceBudgetAndShare(kind, navigate)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create share link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="backup" className="scroll-mt-24 overflow-x-clip bg-[var(--paper)] page-pad py-24">
      <div className="page-shell">
        <div className="flex max-w-[560px] flex-col gap-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
            Backup
          </p>
          <h2 className="max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            Take it with you
          </h2>
          <div className="h-px w-12 bg-[var(--accent)]" aria-hidden />
          <p className="mt-2 max-w-lg text-base leading-[26px] text-[var(--ink-muted)]">
            This budget syncs through your share link. Export a zip anytime for an offline archive, or
            import a zip to start a new shared budget.
          </p>
        </div>

        <div className="mt-12 flex flex-col border-t border-[var(--line-soft)] sm:mt-14">
          <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12 sm:py-10">
            <div className="max-w-sm">
              <p className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,3vw,1.5rem)] leading-snug tracking-tight">
                Export a zip for yourself
              </p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--ink-faint)]">
                Offline archive of this budget — gifts, receipts, and notes.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onExport()}
              className="btn-primary w-full shrink-0 self-start disabled:opacity-50 sm:w-auto sm:self-auto"
            >
              Export backup
            </button>
          </div>

          <div className="flex flex-col gap-6 border-t border-[var(--line-soft)] py-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12 sm:py-10">
            <div className="max-w-sm">
              <p className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,3vw,1.5rem)] leading-snug tracking-tight">
                Share or restore
              </p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--ink-faint)]">
                Copy the live link for your partner, or import a zip to start fresh.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3.5 sm:items-end">
              <button
                type="button"
                disabled={busy || !shareUrl}
                onClick={() => void onCopyShare()}
                className={linkAction}
              >
                Copy share link
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setImportOpen(true)}
                className={linkAction}
              >
                Import backup
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5 border-t border-[var(--line-soft)] pt-8 sm:pt-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
                Start over
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void replaceAndShare('blank')}
                className={linkQuiet}
              >
                New blank budget
              </button>
              <span className="text-[var(--ink-faint)]/40" aria-hidden>
                ·
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void replaceAndShare('demo')}
                className={linkQuiet}
              >
                Load demo
              </button>
            </div>
            <Link to="/" className={linkAction}>
              About Trousseau
            </Link>
          </div>
        </div>
      </div>

      {importOpen ? (
        <ImportBackupDialog
          onClose={() => setImportOpen(false)}
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
    </section>
  )
}
