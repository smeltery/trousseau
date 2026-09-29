import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../_lib/cors.js'
import {
  isBackupPayload,
  loadSnapshot,
  replaceBudget,
  resolveBudgetId,
} from '../_lib/budget-repo.js'
import { clientIp, rateLimit, tooMany } from '../_lib/rate-limit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return

  const token = String(req.query.token ?? '')
  if (!token) {
    res.status(400).json({ error: 'Missing token' })
    return
  }

  const ip = clientIp(req)
  if (!rateLimit(`budget:${ip}:${req.method}`, { limit: 120, windowMs: 60_000 })) {
    tooMany(res)
    return
  }

  try {
    const budgetId = await resolveBudgetId(token)
    if (!budgetId) {
      res.status(404).json({ error: 'Shared budget not found' })
      return
    }

    if (req.method === 'GET') {
      const snapshot = await loadSnapshot(budgetId)
      res.status(200).json(snapshot)
      return
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      if (!isBackupPayload(body)) {
        res.status(400).json({ error: 'Invalid backup payload' })
        return
      }
      const updatedAt = await replaceBudget(budgetId, body)
      res.status(200).json({ updatedAt })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Request failed' })
  }
}
