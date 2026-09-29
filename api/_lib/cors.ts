import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOW_HEADERS = 'Content-Type, Authorization'

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS)
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
