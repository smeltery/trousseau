import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadBlob, exportBackup, importBackup } from '../lib/export-import'
import { loadDemoSample, resetToBlank } from '../db/dexie'

/** Tracker backup — styled to match Paper Backup marketing section. */
export function BackupBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onExport() {
    setBusy(true)
    setMessage(null)
    try {
      const blob = await exportBackup()
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `trousseau-backup-${stamp}.zip`)
      setMessage('Backup downloaded.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  async function onImport(file: File) {
    if (!confirm('Import will replace all local data. Continue?')) return
    setBusy(true)
    setMessage(null)
    try {
      await importBackup(file)
      setMessage('Backup restored.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-[var(--paper)] page-pad py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          Backup
        </p>
        <h2 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Take it with you
        </h2>
        <p className="mt-4 max-w-lg text-base leading-[26px] text-[var(--ink-muted)]">
          Download a zip of your budget and attachments whenever you switch machines or want a durable
          copy. Import brings everything back.
        </p>

        <div className="mt-14 flex flex-col gap-8 border-t border-[var(--line-soft)] pt-10 sm:flex-row sm:items-baseline sm:justify-between sm:gap-12">
          <p className="max-w-sm font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight">
            Export before you clear history. Import when you land somewhere new.
          </p>
          <div className="flex flex-wrap gap-3">
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
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="btn-ghost disabled:opacity-50"
            >
              Import backup
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-6 text-sm text-[var(--ink-faint)]">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Reset to a blank starter? This clears attachments and custom labels.')) {
                return
              }
              setBusy(true)
              try {
                await resetToBlank()
                setMessage('Reset to blank starter.')
              } finally {
                setBusy(false)
              }
            }}
            className="hover:text-[var(--danger)] disabled:opacity-50"
          >
            Reset blank
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Load the filled demo sample? This replaces your current budget.')) {
                return
              }
              setBusy(true)
              try {
                await loadDemoSample()
                setMessage('Demo sample loaded.')
              } finally {
                setBusy(false)
              }
            }}
            className="hover:text-[var(--ink)] disabled:opacity-50"
          >
            Load demo
          </button>
          <Link to="/" className="text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)]">
            About Trousseau
          </Link>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onImport(file)
            e.target.value = ''
          }}
        />

        {message ? (
          <p className="mt-5 text-sm font-medium text-[var(--accent-deep)]">{message}</p>
        ) : null}
      </div>
    </section>
  )
}
