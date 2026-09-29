import type { VercelRequest, VercelResponse } from '@vercel/node'
import { putBlob } from '../../_lib/blob-store.js'
import { applyCors } from '../../_lib/cors.js'
import { deleteAttachment, insertAttachment, resolveBudgetId } from '../../_lib/budget-repo.js'
import { clientIp, rateLimit, tooMany } from '../../_lib/rate-limit.js'
import type { AttachmentMeta } from '../../_lib/types.js'

export const config = {
  api: { bodyParser: false },
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return

  const token = String(req.query.token ?? '')
  if (!token) {
    res.status(400).json({ error: 'Missing token' })
    return
  }

  const ip = clientIp(req)
  if (!rateLimit(`att:${ip}`, { limit: 60, windowMs: 60_000 })) {
    tooMany(res)
    return
  }

  try {
    const budgetId = await resolveBudgetId(token)
    if (!budgetId) {
      res.status(404).json({ error: 'Shared budget not found' })
      return
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : ''
      if (!id) {
        res.status(400).json({ error: 'Missing attachment id' })
        return
      }
      const ok = await deleteAttachment(budgetId, id)
      if (!ok) {
        res.status(404).json({ error: 'Attachment not found' })
        return
      }
      res.status(204).end()
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const raw = await readRawBody(req)
    const body = JSON.parse(raw.toString('utf8')) as AttachmentMeta & { dataBase64?: string }

    if (body.kind === 'link' || (body.url && !body.dataBase64)) {
      if (!body?.id || !body.lineItemId || !body.name) {
        res.status(400).json({ error: 'Invalid attachment' })
        return
      }
      const att: AttachmentMeta = {
        id: body.id,
        lineItemId: body.lineItemId,
        kind: body.kind ?? 'link',
        name: body.name,
        url: body.url,
        mime: body.mime,
        size: body.size,
        createdAt: body.createdAt || new Date().toISOString(),
      }
      await insertAttachment(budgetId, att)
      res.status(201).json(att)
      return
    }

    if (!body?.id || !body.lineItemId || !body.name || !body.dataBase64) {
      res.status(400).json({ error: 'Invalid file upload' })
      return
    }
    const buffer = Buffer.from(body.dataBase64, 'base64')
    if (buffer.length > 25 * 1024 * 1024) {
      res.status(400).json({ error: 'File larger than 25 MB' })
      return
    }
    const safe = body.name.replace(/[^\w.-]+/g, '_')
    const pathname = `budgets/${budgetId}/${body.id}-${safe}`
    const blob = await putBlob(pathname, buffer, {
      contentType: body.mime || 'application/octet-stream',
    })
    const att: AttachmentMeta = {
      id: body.id,
      lineItemId: body.lineItemId,
      kind: 'file',
      name: body.name,
      url: blob.url,
      mime: body.mime,
      size: buffer.length,
      createdAt: new Date().toISOString(),
      blobPathname: blob.pathname,
    }
    await insertAttachment(budgetId, att)
    res.status(201).json(att)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Attachment failed' })
  }
}
