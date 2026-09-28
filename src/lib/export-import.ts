import JSZip from 'jszip'
import { db } from '../db/dexie'
import type { Attachment, BackupPayload } from '../db/types'
import { DEFAULT_SITE, SITE_META_KEY } from './site-settings'

export async function exportBackup(): Promise<Blob> {
  const [funds, categories, lineItems, attachments, siteMeta] = await Promise.all([
    db.funds.toArray(),
    db.categories.toArray(),
    db.lineItems.toArray(),
    db.attachments.toArray(),
    db.meta.get(SITE_META_KEY),
  ])

  const zip = new JSZip()
  const files = zip.folder('files')
  const payloadAttachments: BackupPayload['attachments'] = []

  for (const att of attachments) {
    const entry: BackupPayload['attachments'][number] = {
      id: att.id,
      lineItemId: att.lineItemId,
      kind: att.kind,
      name: att.name,
      url: att.url,
      mime: att.mime,
      size: att.size,
      createdAt: att.createdAt,
    }
    if (att.kind === 'file' && att.blob) {
      const safe = att.name.replace(/[^\w.-]+/g, '_')
      const path = `${att.id}-${safe}`
      entry.filePath = path
      files?.file(path, att.blob)
    }
    payloadAttachments.push(entry)
  }

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    funds,
    categories,
    lineItems,
    attachments: payloadAttachments,
    site: siteMeta?.value ?? JSON.stringify(DEFAULT_SITE),
  }

  zip.file('trousseau.json', JSON.stringify(payload, null, 2))
  return zip.generateAsync({ type: 'blob' })
}

export async function importBackup(file: Blob): Promise<void> {
  const zip = await JSZip.loadAsync(file)
  const jsonFile = zip.file('trousseau.json')
  if (!jsonFile) throw new Error('Backup is missing trousseau.json')

  const payload = JSON.parse(await jsonFile.async('string')) as BackupPayload
  if (payload.version !== 1) throw new Error('Unsupported backup version')

  const restored: Attachment[] = []
  for (const att of payload.attachments) {
    const next: Attachment = {
      id: att.id,
      lineItemId: att.lineItemId,
      kind: att.kind,
      name: att.name,
      url: att.url,
      mime: att.mime,
      size: att.size,
      createdAt: att.createdAt,
    }
    if (att.kind === 'file' && att.filePath) {
      const blobFile = zip.file(`files/${att.filePath}`)
      if (blobFile) {
        next.blob = await blobFile.async('blob')
        if (att.mime) {
          next.blob = new Blob([next.blob], { type: att.mime })
        }
      }
    }
    restored.push(next)
  }

  await db.transaction(
    'rw',
    db.funds,
    db.categories,
    db.lineItems,
    db.attachments,
    db.meta,
    async () => {
      await Promise.all([
        db.funds.clear(),
        db.categories.clear(),
        db.lineItems.clear(),
        db.attachments.clear(),
      ])
      await db.funds.bulkAdd(payload.funds)
      await db.categories.bulkAdd(payload.categories)
      await db.lineItems.bulkAdd(payload.lineItems)
      if (restored.length) await db.attachments.bulkAdd(restored)
      await db.meta.put({
        key: SITE_META_KEY,
        value: payload.site ?? JSON.stringify(DEFAULT_SITE),
      })
      await db.meta.put({ key: 'seeded', value: new Date().toISOString() })
    },
  )
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
