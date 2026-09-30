export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

type Listener = (status: SyncStatus) => void
type SavedListener = (at: number | null) => void

let status: SyncStatus = 'idle'
let lastSavedAt: number | null = null
let savedTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<Listener>()
const savedListeners = new Set<SavedListener>()

function emit() {
  for (const listener of listeners) listener(status)
}

function emitSaved() {
  for (const listener of savedListeners) listener(lastSavedAt)
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function getLastSavedAt(): number | null {
  return lastSavedAt
}

export function subscribeSyncStatus(listener: Listener): () => void {
  listeners.add(listener)
  listener(status)
  return () => {
    listeners.delete(listener)
  }
}

export function subscribeLastSavedAt(listener: SavedListener): () => void {
  savedListeners.add(listener)
  listener(lastSavedAt)
  return () => {
    savedListeners.delete(listener)
  }
}

/** Seed last-saved from cloud meta (ISO) without changing sync status. */
export function noteCloudUpdatedAt(iso: string | undefined): void {
  if (!iso) return
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return
  lastSavedAt = ms
  emitSaved()
}

export function setSyncStatus(next: SyncStatus): void {
  if (savedTimer) {
    clearTimeout(savedTimer)
    savedTimer = undefined
  }
  status = next
  if (next === 'saved') {
    lastSavedAt = Date.now()
    emitSaved()
  }
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
