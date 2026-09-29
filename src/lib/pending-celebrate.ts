const KEY = 'trousseau:pendingCelebrate'

/** Queue a toast + confetti for after the next ready budget screen. */
export function queueCelebrate(message: string): void {
  try {
    sessionStorage.setItem(KEY, message)
  } catch {
    // private mode
  }
}

/** Consume a queued celebrate message, if any. */
export function takePendingCelebrate(): string | null {
  try {
    const message = sessionStorage.getItem(KEY)
    if (message) sessionStorage.removeItem(KEY)
    return message
  } catch {
    return null
  }
}
