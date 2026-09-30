export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

type Listener = (status: SyncStatus) => void

let status: SyncStatus = 'idle'
let savedTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(status)
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(listener: Listener): () => void {
  listeners.add(listener)
  listener(status)
  return () => {
    listeners.delete(listener)
  }
}

export function setSyncStatus(next: SyncStatus): void {
  if (savedTimer) {
    clearTimeout(savedTimer)
    savedTimer = undefined
  }
  status = next
  emit()
  if (next === 'saved') {
    savedTimer = setTimeout(() => {
      if (status === 'saved') {
        status = 'idle'
        emit()
      }
    }, 2200)
  }
}

export function syncStatusLabel(status: SyncStatus): string | null {
  switch (status) {
    case 'saving':
      return 'Saving…'
    case 'saved':
      return 'Saved'
    case 'error':
      return 'Couldn’t sync — retry'
    case 'offline':
      return 'Offline — edits stay on this device'
    default:
      return null
  }
}
