import type { VercelResponse } from '@vercel/node'

const hits = new Map<string, { count: number; resetAt: number }>()

/** Lightweight per-instance rate limit (best-effort on serverless). */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): boolean {
  const now = Date.now()
  const row = hits.get(key)
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + opts.windowMs })
    return true
  }
  if (row.count >= opts.limit) return false
  row.count += 1
  return true
}

export function clientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0]!.trim()
  if (Array.isArray(fwd) && fwd[0]) return fwd[0].split(',')[0]!.trim()
  return 'unknown'
}

export function tooMany(res: VercelResponse): void {
  res.status(429).json({ error: 'Too many requests. Try again shortly.' })
}
