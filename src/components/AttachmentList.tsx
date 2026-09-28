import { useEffect, useMemo, useState } from 'react'
import { db, newId } from '../db/dexie'
import type { Attachment } from '../db/types'

interface AttachmentListProps {
  lineItemId: string
  attachments: Attachment[]
}

export function AttachmentList({ lineItemId, attachments }: AttachmentListProps) {
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addFiles(files: FileList | File[]) {
    setError(null)
    const list = Array.from(files)
    let added = 0
    for (const file of list) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`${file.name} is larger than 25 MB`)
        continue
      }
      await db.attachments.add({
        id: newId('att'),
        lineItemId,
        kind: 'file',
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        blob: file,
        createdAt: new Date().toISOString(),
      })
      added += 1
    }
    if (added > 0) {
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 900)
    }
  }

  async function addLink() {
    setError(null)
    const url = linkUrl.trim()
    if (!url) return
    try {
      void new URL(url)
    } catch {
      setError('Enter a valid URL (include https://)')
      return
    }
    await db.attachments.add({
      id: newId('att'),
      lineItemId,
      kind: 'link',
      name: linkName.trim() || url,
      url,
      createdAt: new Date().toISOString(),
    })
    setLinkName('')
    setLinkUrl('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
          Documents
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-faint)]">
          Upload invoices or receipts, or paste a Drive / Dropbox link.
        </p>
      </div>

      <label
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) await addFiles(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed px-4 py-10 text-center transition-colors ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.01]'
            : justAdded
              ? 'border-[var(--lichen)] bg-[color-mix(in_srgb,var(--lichen)_12%,transparent)]'
              : 'border-[var(--line)] bg-[color-mix(in_srgb,var(--wash)_60%,transparent)] hover:border-[var(--accent)]'
        }`}
      >
        <span className="font-medium text-[var(--ink)]">
          {justAdded ? 'Added' : dragging ? 'Drop to attach' : 'Drop files here'}
        </span>
        <span className="mt-1 text-sm text-[var(--ink-faint)]">or click to browse · max 25 MB</span>
        <input
          type="file"
          multiple
          className="sr-only"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={async (e) => {
            if (e.target.files?.length) await addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          placeholder="Link name"
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          className="rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
        <input
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addLink()
          }}
          className="rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => void addLink()}
          className="btn-primary"
        >
          Add link
        </button>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {attachments.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {attachments.map((att) => (
            <AttachmentRow key={att.id} attachment={att} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AttachmentRow({ attachment }: { attachment: Attachment }) {
  const objectUrl = useMemo(() => {
    if (attachment.kind === 'file' && attachment.blob) {
      return URL.createObjectURL(attachment.blob)
    }
    return null
  }, [attachment])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const isImage = Boolean(attachment.mime?.startsWith('image/'))
  const isPdf = attachment.mime === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
      {attachment.kind === 'file' && objectUrl && isImage ? (
        <a href={objectUrl} target="_blank" rel="noreferrer" className="shrink-0">
          <img
            src={objectUrl}
            alt=""
            className="h-16 w-16 rounded-sm object-cover ring-1 ring-[var(--line)]"
          />
        </a>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{attachment.name}</p>
        <p className="text-sm text-[var(--ink-faint)]">
          {attachment.kind === 'link'
            ? 'Link'
            : [attachment.mime, attachment.size ? formatBytes(attachment.size) : null]
                .filter(Boolean)
                .join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {attachment.kind === 'link' && attachment.url ? (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Open link
            </a>
          ) : null}
          {attachment.kind === 'file' && objectUrl ? (
            <a
              href={objectUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {isPdf || isImage ? 'Preview' : 'Open'}
            </a>
          ) : null}
          {attachment.kind === 'file' && objectUrl ? (
            <a
              href={objectUrl}
              download={attachment.name}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Download
            </a>
          ) : null}
          <button
            type="button"
            className="text-[var(--ink-faint)] hover:text-[var(--danger)]"
            onClick={async () => {
              if (confirm(`Remove “${attachment.name}”?`)) {
                await db.attachments.delete(attachment.id)
              }
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
