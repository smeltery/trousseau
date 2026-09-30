import { useState } from 'react'
import { db, newId } from '../db/dexie'
import type { Attachment } from '../db/types'
import { apiUploadFile, apiAddLinkAttachment } from '../lib/cloud/api-client'
import { getActiveCloudToken } from '../lib/cloud/session'
import { dbWrite } from '../lib/db-write'
import { AttachmentRow } from './expenses/AttachmentRow'

interface AttachmentListProps {
  lineItemId: string
  attachments: Attachment[]
}

type UploadJob = {
  localId: string
  name: string
  progress: number
  error?: string
  file: File
  id: string
}

export function AttachmentList({ lineItemId, attachments }: AttachmentListProps) {
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploads, setUploads] = useState<UploadJob[]>([])

  function patchUpload(localId: string, patch: Partial<UploadJob>) {
    setUploads((prev) => prev.map((u) => (u.localId === localId ? { ...u, ...patch } : u)))
  }

  async function uploadOne(job: UploadJob) {
    setError(null)
    patchUpload(job.localId, { progress: 0.05, error: undefined })
    const token = getActiveCloudToken()
    if (token) {
      try {
        const uploaded = await apiUploadFile(token, {
          id: job.id,
          lineItemId,
          name: job.file.name,
          mime: job.file.type || 'application/octet-stream',
          blob: job.file,
          onProgress: (ratio) => patchUpload(job.localId, { progress: ratio }),
        })
        await dbWrite(() => db.attachments.add(uploaded))
        setUploads((prev) => prev.filter((u) => u.localId !== job.localId))
        setJustAdded(true)
        window.setTimeout(() => setJustAdded(false), 900)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        patchUpload(job.localId, { error: message, progress: 0 })
        setError(message)
      }
      return
    }
    await dbWrite(() =>
      db.attachments.add({
        id: job.id,
        lineItemId,
        kind: 'file',
        name: job.file.name,
        mime: job.file.type || 'application/octet-stream',
        size: job.file.size,
        blob: job.file,
        createdAt: new Date().toISOString(),
      }),
    )
    setUploads((prev) => prev.filter((u) => u.localId !== job.localId))
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 900)
  }

  async function addFiles(files: FileList | File[]) {
    setError(null)
    const jobs: UploadJob[] = []
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`${file.name} is larger than 25 MB`)
        continue
      }
      jobs.push({
        localId: crypto.randomUUID(),
        id: newId('att'),
        name: file.name,
        progress: 0,
        file,
      })
    }
    if (!jobs.length) return
    setUploads((prev) => [...prev, ...jobs])
    for (const job of jobs) await uploadOne(job)
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
    const att: Attachment = {
      id: newId('att'),
      lineItemId,
      kind: 'link',
      name: linkName.trim() || url,
      url,
      createdAt: new Date().toISOString(),
    }
    const token = getActiveCloudToken()
    if (token) {
      try {
        await apiAddLinkAttachment(token, att)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save link')
        return
      }
    }
    await dbWrite(() => db.attachments.add(att))
    setLinkName('')
    setLinkUrl('')
  }

  return (
    <div className="min-w-0 space-y-6">
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

      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <input
          placeholder="Link name"
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          className="min-w-0 rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
        <input
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addLink()
          }}
          className="min-w-0 rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
        />
        <button type="button" onClick={() => void addLink()} className="btn-primary shrink-0 whitespace-nowrap">
          Add link
        </button>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {uploads.length > 0 ? (
        <ul className="space-y-3 border-t border-[var(--line)] pt-4">
          {uploads.map((job) => (
            <li key={job.localId} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{job.name}</span>
                {job.error ? (
                  <button
                    type="button"
                    className="shrink-0 font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4"
                    onClick={() => void uploadOne(job)}
                  >
                    Retry
                  </button>
                ) : (
                  <span className="shrink-0 tabular-nums text-[var(--ink-faint)]">
                    {Math.round(job.progress * 100)}%
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line-soft)]">
                <div
                  className={`h-full ${job.error ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`}
                  style={{ width: `${Math.max(job.error ? 100 : job.progress * 100, 4)}%` }}
                />
              </div>
              {job.error ? <p className="text-xs text-[var(--danger)]">{job.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {attachments.length === 0 && uploads.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">No documents yet.</p>
      ) : attachments.length > 0 ? (
        <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {attachments.map((att) => (
            <AttachmentRow key={att.id} attachment={att} />
          ))}
        </ul>
      ) : null}
    </div>
  )
}
