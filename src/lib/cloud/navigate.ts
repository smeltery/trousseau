import type { NavigateFunction } from 'react-router-dom'
import { rememberShareToken } from './session'

export function sharedBudgetPath(token: string): string {
  return `/b/${token}`
}

/**
 * Go to a share URL. Prefer passing `navigate` from React Router so the app
 * soft-routes without remounting (avoids a second boot splash).
 */
export function goToSharedBudget(token: string, navigate?: NavigateFunction): void {
  rememberShareToken(token)
  const path = sharedBudgetPath(token)
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  if (typeof window !== 'undefined' && window.location.pathname === path) return
  if (navigate) {
    navigate(`${path}${hash}`, { replace: true })
    return
  }
  window.location.replace(`${path}${hash}`)
}
