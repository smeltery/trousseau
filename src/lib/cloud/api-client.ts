import type { Attachment, BackupPayload } from '../../db/types'

export interface CloudSnapshot extends BackupPayload {
  updatedAt: string
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`
}

export async function apiCreateBudget(
  payload: BackupPayload,
): Promise<{ token: string; url: string }> {
  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ token: string; url: string }>
}

export async function apiGetBudget(token: string): Promise<CloudSnapshot> {
  const res = await fetch(`/api/budgets/${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<CloudSnapshot>
}

export async function apiPutBudget(
  token: string,
  payload: BackupPayload,
): Promise<{ updatedAt: string }> {
  const res = await fetch(`/api/budgets/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ updatedAt: string }>
}

export async function apiUploadFile(
  token: string,
  opts: {
    id: string
    lineItemId: string
    name: string
    mime?: string
    blob: Blob
    onProgress?: (ratio: number) => void
  },
): Promise<Attachment> {
  const buffer = await opts.blob.arrayBuffer()
  opts.onProgress?.(0.15)
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
    reader.readAsDataURL(new Blob([buffer], { type: opts.mime || 'application/octet-stream' }))
  })
  opts.onProgress?.(0.35)

  const body = JSON.stringify({
    id: opts.id,
    lineItemId: opts.lineItemId,
    name: opts.name,
    mime: opts.mime,
    kind: 'file',
    dataBase64,
  })

  const att = await new Promise<Attachment>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/budgets/${encodeURIComponent(token)}/attachments`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return
      opts.onProgress?.(0.35 + (e.loaded / e.total) * 0.6)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Attachment)
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Bad upload response'))
        }
        return
      }
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: string }
        reject(new Error(parsed.error || `Request failed (${xhr.status})`))
      } catch {
        reject(new Error(`Request failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(body)
  })

  opts.onProgress?.(1)
  return {
    id: att.id,
    lineItemId: att.lineItemId,
    kind: 'file',
    name: att.name,
    url: att.url,
    mime: att.mime,
    size: att.size,
    createdAt: att.createdAt,
  }
}

export async function apiAddLinkAttachment(
  token: string,
  att: Attachment,
): Promise<Attachment> {
  const res = await fetch(`/api/budgets/${encodeURIComponent(token)}/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: att.id,
      lineItemId: att.lineItemId,
      kind: 'link',
      name: att.name,
      url: att.url,
      createdAt: att.createdAt,
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<Attachment>
}

export async function apiDeleteAttachment(token: string, id: string): Promise<void> {
  const res = await fetch(
    `/api/budgets/${encodeURIComponent(token)}/attachments?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
  if (!res.ok && res.status !== 404) throw new Error(await parseError(res))
}
