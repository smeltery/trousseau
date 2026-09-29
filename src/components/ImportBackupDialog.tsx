import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { restoreBackupZip } from '../lib/backup-actions'
import { publishShareLink } from '../lib/cloud/sync'
import { dbWrite } from '../lib/db-write'
import { useDialogFocus } from '../lib/use-dialog-focus'

const SAMPLE_URL = '/samples/sample-wedding.zip'

interface ImportBackupDialogProps {
  onClose: () => void
  onImported?: (share?: { token: string; url: string }) => void
}

export function ImportBackupDialog({ onClose, onImported }: ImportBackupDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Importing…')
  const [error, setError] = useState<string | null>(null)

  useDialogFocus(dialogRef)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const takeFile = useCallback((next: File | undefined) => {
    if (!next) return
    setError(null)
    if (!next.name.toLowerCase().endsWith('.zip') && next.type !== 'application/zip') {
      setError('Choose a Trousseau .zip backup.')
      setFile(null)
      return
    }
    setFile(next)
  }, [])

  async function runImport() {
    if (!file) return
    setBusy(true)
    setBusyLabel('Importing…')
    setError(null)
    try {
      const ok = await dbWrite(() => restoreBackupZip(file))
      if (ok === undefined) return

      setBusyLabel('Creating share link…')
      try {
        const share = await publishShareLink()
        try {
          await navigator.clipboard.writeText(share.url)
        } catch {
          // Clipboard may be blocked; navigation still carries the token.
        }
        onImported?.(share)
        onClose()
      } catch (shareErr) {
        setError(
          shareErr instanceof Error
            ? shareErr.message
            : 'Imported locally, but share link failed. Try Import again.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!busy) setDragging(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    takeFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_40%,transparent)] animate-[fade-in_0.25s_ease]"
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-[var(--wash)] p-6 text-[var(--ink)] shadow-[var(--sheet-shadow)] animate-[sheet-in_0.35s_var(--ease-out)] sm:rounded-2xl"
      >
        <h2
          id={titleId}
          className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-[var(--ink)]"
        >
          Import backup
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          This replaces all local budget data in this browser, then creates a secret share link so you
          can keep editing from any device. Treat that link like a password.
        </p>

        <div
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`mt-6 rounded-sm border border-dashed px-4 py-10 text-center transition-colors ${
            dragging
              ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
              : 'border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_70%,transparent)]'
          }`}
        >
          <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            {dragging ? 'Drop to select' : 'Drop a .zip here'}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Or{' '}
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)] disabled:opacity-50"
            >
              choose a file
            </button>
          </p>
        </div>

        {file ? (
          <p className="mt-4 truncate text-sm font-medium text-[var(--ink)]" title={file.name}>
            Selected: {file.name}
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || !file}
            onClick={() => void runImport()}
            className="btn-primary disabled:opacity-50"
          >
            {busy ? busyLabel : 'Import & share'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn-ghost disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="mt-6 text-sm text-[var(--ink-faint)]">
          Need a starting point?{' '}
          <a
            href={SAMPLE_URL}
            download="sample-wedding.zip"
            className="font-medium text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--ink)]"
          >
            Download sample wedding
          </a>
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            takeFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
