const HINT_KEY = 'trousseau:share-hint-dismissed'

export function isShareHintDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissShareHint(): void {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // ignore private mode failures
  }
}
