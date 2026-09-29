import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { downloadBackupZip } from '../lib/backup-actions'
import { loadDemoSample, resetToBlank } from '../db/dexie'
import { celebrate } from '../lib/celebrate'
import { publishShareLink } from '../lib/cloud/sync'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { showToast } from '../lib/toast'
import { ImportBackupDialog } from './ImportBackupDialog'

const SAMPLE_URL = '/samples/sample-wedding.zip'

/** Tracker backup: export, import modal, share link, and sample download. */
export function BackupBar({
  cloudMode = false,
  shareUrl,
}: {
  cloudMode?: boolean
  shareUrl?: string
}) {
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

  async function onCreateShare() {
    const ok = await askConfirm({
      title: 'Create a share link?',
      body: 'Anyone with the link can view and edit this budget. Treat it like a password — don’t post it publicly.',
      confirmLabel: 'Create link',
    })
    if (!ok) return
    setBusy(true)
    try {
      const { url, token } = await publishShareLink()
      try {
        await navigator.clipboard.writeText(url)
        showToast('Share link copied')
      } catch {
        showToast('Share link ready')
      }
      celebrate()
      void navigate(`/b/${token}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create share link')
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
          {cloudMode
            ? 'This budget syncs through your share link. Export a zip anytime for an offline copy.'
            : 'Download a zip for a durable copy, or create a secret share link so you and your partner can edit on any device.'}
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
          {cloudMode ? (
            <button
              type="button"
              disabled={busy || !shareUrl}
              onClick={() => void onCopyShare()}
              className="btn-ghost disabled:opacity-50"
            >
              Copy share link
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCreateShare()}
              className="btn-ghost disabled:opacity-50"
            >
              Create share link
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setImportOpen(true)}
            className="btn-ghost disabled:opacity-50"
          >
            Import backup
          </button>
          {!cloudMode ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await askConfirm({
                    title: 'Start a blank budget?',
                    body: 'This replaces any budget data already in this browser.',
                    confirmLabel: 'Start blank',
                    danger: true,
                  })
                  if (!ok) return
                  setBusy(true)
                  try {
                    await dbWrite(() => resetToBlank())
                    showToast('Blank budget ready')
                    celebrate()
                  } finally {
                    setBusy(false)
                  }
                }}
                className="btn-ghost disabled:opacity-50"
              >
                New blank
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await askConfirm({
                    title: 'Load the filled demo?',
                    body: 'This replaces your current budget.',
                    confirmLabel: 'Load demo',
                    danger: true,
                  })
                  if (!ok) return
                  setBusy(true)
                  try {
                    await dbWrite(() => loadDemoSample())
                    showToast('Demo sample loaded')
                    celebrate()
                  } finally {
                    setBusy(false)
                  }
                }}
                className="btn-ghost disabled:opacity-50"
              >
                Load demo
              </button>
            </>
          ) : (
            <Link to="/app" className="btn-ghost">
              Open local copy
            </Link>
          )}
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
              showToast('Backup imported (share link unavailable)')
              celebrate()
            }
          }}
        />
      ) : null}
    </section>
  )
}
