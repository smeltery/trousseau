/** Truncate a share URL for display; keeps origin + token hint. */
export function truncateShareUrl(url: string, max = 42): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 18 ? `${u.pathname.slice(0, 10)}…${u.pathname.slice(-6)}` : u.pathname
    const shown = `${u.host}${path}`
    return shown.length > max ? `${shown.slice(0, max - 1)}…` : shown
  } catch {
    return url.length > max ? `${url.slice(0, max - 1)}…` : url
  }
}
