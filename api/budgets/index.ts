import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../_lib/cors.js'
import { createBudget, isBackupPayload } from '../_lib/budget-repo.js'
import { clientIp, rateLimit, tooMany } from '../_lib/rate-limit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const ip = clientIp(req)
  if (!rateLimit(`create:${ip}`, { limit: 10, windowMs: 60_000 })) {
    tooMany(res)
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!isBackupPayload(body)) {
      res.status(400).json({ error: 'Invalid backup payload' })
      return
    }
    const { token } = await createBudget(body)
    const host = req.headers['x-forwarded-host'] ?? req.headers.host
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const origin = typeof host === 'string' ? `${proto}://${host}` : ''
    res.status(201).json({
      token,
      url: origin ? `${origin}/b/${token}` : `/b/${token}`,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Create failed' })
  }
}
