const KEY = 'trousseau-hide-paid'

export function readHidePaid(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function writeHidePaid(next: boolean): void {
  try {
    sessionStorage.setItem(KEY, next ? '1' : '0')
  } catch {
    /* ignore */
  }
}
