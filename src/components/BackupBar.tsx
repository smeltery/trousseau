import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { downloadBackupZip } from '../lib/backup-actions'
import { loadDemoSample, resetToBlank } from '../db/dexie'
import { celebrate } from '../lib/celebrate'
import { clearRememberedShareToken } from '../lib/cloud/session'
import { publishShareLink } from '../lib/cloud/sync'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { showToast } from '../lib/toast'
import { ImportBackupDialog } from './ImportBackupDialog'

const SAMPLE_URL = '/samples/sample-wedding.zip'

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
      celebrate()
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
      title: kind === 'blank' ? 'Start a blank budget?' : 'Load the filled demo?',
      body: 'This replaces your current budget and opens a new share link.',
      confirmLabel: kind === 'blank' ? 'Start blank' : 'Load demo',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      clearRememberedShareToken()
      await dbWrite(() => (kind === 'blank' ? resetToBlank() : loadDemoSample()))
      const share = await publishShareLink()
      try {
        await navigator.clipboard.writeText(share.url)
      } catch {
        // Navigation still lands on the new link.
      }
      showToast(kind === 'blank' ? 'Blank budget ready' : 'Demo sample loaded')
      celebrate()
      void navigate(`/b/${share.token}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create share link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="backup" className="scroll-mt-24 bg-[var(--paper)] page-pad py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          Backup
        </p>
        <h2 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Take it with you
        </h2>
        <p className="mt-4 max-w-lg text-base leading-[26px] text-[var(--ink-muted)]">
          This budget syncs through your share link. Export a zip anytime for an offline archive, or
          import a zip to start a new shared budget.
        </p>

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-[var(--line-soft)] pt-10">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onExport()}
            className="btn-primary disabled:opacity-50"
          >
            Export backup
          </button>
          <button
            type="button"
            disabled={busy || !shareUrl}
            onClick={() => void onCopyShare()}
            className="btn-ghost disabled:opacity-50"
          >
            Copy share link
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setImportOpen(true)}
            className="btn-ghost disabled:opacity-50"
          >
            Import backup
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void replaceAndShare('blank')}
            className="btn-ghost disabled:opacity-50"
          >
            New blank
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void replaceAndShare('demo')}
            className="btn-ghost disabled:opacity-50"
          >
            Load demo
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-6 text-sm text-[var(--ink-faint)]">
          <a
            href={SAMPLE_URL}
            download="sample-wedding.zip"
            className="text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)]"
          >
            Download sample wedding
          </a>
          <Link to="/" className="text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)]">
            About Trousseau
          </Link>
        </div>
      </div>

      {importOpen ? (
        <ImportBackupDialog
          onClose={() => setImportOpen(false)}
          onImported={(share) => {
            if (share) {
              showToast('Imported — share link copied')
              celebrate()
              void navigate(`/b/${share.token}`)
            } else {
              showToast('Import needs a share link — try again')
            }
          }}
        />
      ) : null}
    </section>
  )
}
