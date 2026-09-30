type HintStep = 'date' | 'gift' | 'share' | 'due'

const KEYS: Record<HintStep, string> = {
  date: 'trousseau:hint-date-dismissed',
  gift: 'trousseau:hint-gift-dismissed',
  share: 'trousseau:share-hint-dismissed',
  due: 'trousseau:hint-due-dismissed',
}

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function write(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // private mode
  }
}

export function isHintDismissed(step: HintStep): boolean {
  return read(KEYS[step])
}

export function dismissHint(step: HintStep): void {
  write(KEYS[step])
}

/** Re-export share helpers for call sites that already import share-hint. */
export { dismissShareHint, isShareHintDismissed } from '../share-hint'
