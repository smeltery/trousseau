/** Short relative/absolute phrase for sync freshness. */
export function formatSyncedAt(isoOrMs: string | number, now = Date.now()): string {
  const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs)
  if (Number.isNaN(ms)) return ''
  const delta = Math.max(0, now - ms)
  if (delta < 45_000) return 'just now'
  if (delta < 90_000) return '1 min ago'
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)} min ago`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)} hr ago`
  const d = new Date(ms)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
