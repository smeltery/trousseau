const HINT_KEY = 'trousseau:names-hint-dismissed'

export function isNamesHintDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissNamesHint(): void {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // ignore private mode failures
  }
}
