import { rememberShareToken } from './session'

/** Navigate the browser to a share URL (updates the address bar). */
export function goToSharedBudget(token: string): void {
  rememberShareToken(token)
  const path = `/b/${token}`
  if (window.location.pathname === path) return
  window.location.replace(`${path}${window.location.hash}`)
}
