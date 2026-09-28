import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadBlob, exportBackup, importBackup } from '../lib/export-import'
import { loadDemoSample, resetToBlank } from '../db/dexie'

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
    <footer className="mx-auto w-full max-w-[var(--max)] px-6 py-20 sm:px-10 lg:px-16">
      <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
        Keep it safe
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,2.75rem)] tracking-tight">
        Backup
      </h2>
      <p className="mt-4 max-w-xl text-[var(--ink-muted)]">
        Everything lives in this browser. Export a zip before clearing site data or switching
        devices. Reset clears your data to a blank starter; load demo fills sample numbers.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
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
          className="px-4 py-2.5 text-sm text-[var(--ink-faint)] hover:text-[var(--danger)] disabled:opacity-50"
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
          className="px-4 py-2.5 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-50"
        >
          Load demo
        </button>
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
      </div>

      <p className="mt-8 text-sm text-[var(--ink-faint)]">
        <Link to="/" className="text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)]">
          Back to Trousseau home
        </Link>
      </p>

      {message ? (
        <p className="mt-5 text-sm font-medium text-[var(--accent-deep)]">{message}</p>
      ) : null}
    </footer>
  )
}
