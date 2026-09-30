import { useEffect, useMemo, useState } from 'react'
import { db } from '../../db/dexie'
import type { Attachment, AttachmentRole } from '../../db/types'
import { askConfirm } from '../../lib/confirm'
import { apiDeleteAttachment } from '../../lib/cloud/api-client'
import { getActiveCloudToken } from '../../lib/cloud/session'
import { dbWrite } from '../../lib/db-write'
import { ReceiptLightbox } from './ReceiptLightbox'

const ROLES: { id: AttachmentRole | ''; label: string }[] = [
  { id: '', label: 'Role…' },
  { id: 'contract', label: 'Contract' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'receipt', label: 'Receipt' },
]

export function AttachmentRow({ attachment }: { attachment: Attachment }) {
  const [lightbox, setLightbox] = useState(false)
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

  const fileHref = objectUrl ?? (attachment.kind === 'file' ? attachment.url : undefined)
  const isImage = Boolean(attachment.mime?.startsWith('image/'))
  const isPdf = attachment.mime === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')
  const roleLabel = attachment.role
    ? attachment.role.charAt(0).toUpperCase() + attachment.role.slice(1)
    : null

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
      {attachment.kind === 'file' && fileHref && isImage ? (
        <button
          type="button"
          className="shrink-0"
          onClick={() => setLightbox(true)}
          aria-label={`Preview ${attachment.name}`}
        >
          <img
            src={fileHref}
            alt=""
            className="h-16 w-16 rounded-sm object-cover ring-1 ring-[var(--line)]"
          />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{attachment.name}</p>
        <p className="text-sm text-[var(--ink-faint)]">
          {[
            roleLabel,
            attachment.kind === 'link'
              ? 'Link'
              : [attachment.mime, attachment.size ? formatBytes(attachment.size) : null]
                  .filter(Boolean)
                  .join(' · '),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">Document role</span>
            <select
              value={attachment.role ?? ''}
              className="field-input py-1 text-xs"
              onChange={(e) => {
                const next = e.target.value as AttachmentRole | ''
                void dbWrite(async () => {
                  if (!next) {
                    await db.attachments
                      .where('id')
                      .equals(attachment.id)
                      .modify((row) => {
                        delete row.role
                      })
                    return
                  }
                  await db.attachments.update(attachment.id, { role: next })
                })
              }}
            >
              {ROLES.map((r) => (
                <option key={r.id || 'none'} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
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
          {attachment.kind === 'file' && fileHref && isImage ? (
            <button
              type="button"
              className="font-medium text-[var(--accent)] hover:underline"
              onClick={() => setLightbox(true)}
            >
              Preview
            </button>
          ) : null}
          {attachment.kind === 'file' && fileHref && !isImage ? (
            <a
              href={fileHref}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {isPdf ? 'Preview' : 'Open'}
            </a>
          ) : null}
          {attachment.kind === 'file' && fileHref ? (
            <a
              href={fileHref}
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
              const ok = await askConfirm({
                title: `Remove “${attachment.name}”?`,
                confirmLabel: 'Remove',
                danger: true,
              })
              if (!ok) return
              const token = getActiveCloudToken()
              if (token) {
                try {
                  await apiDeleteAttachment(token, attachment.id)
                } catch {
                  // Still remove locally if remote is gone.
                }
              }
              await dbWrite(() => db.attachments.delete(attachment.id))
            }}
          >
            Remove
          </button>
        </div>
      </div>
      {lightbox && fileHref && isImage ? (
        <ReceiptLightbox src={fileHref} alt={attachment.name} onClose={() => setLightbox(false)} />
      ) : null}
    </li>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
