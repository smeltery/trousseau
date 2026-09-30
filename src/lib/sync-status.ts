export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

type Listener = (status: SyncStatus) => void
type SavedListener = (at: number | null) => void
type PendingListener = (count: number) => void

let status: SyncStatus = 'idle'
let lastSavedAt: number | null = null
let pendingEdits = 0
let savedTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<Listener>()
const savedListeners = new Set<SavedListener>()
const pendingListeners = new Set<PendingListener>()

function emit() {
  for (const listener of listeners) listener(status)
}

function emitSaved() {
  for (const listener of savedListeners) listener(lastSavedAt)
}

function emitPending() {
  for (const listener of pendingListeners) listener(pendingEdits)
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function getLastSavedAt(): number | null {
  return lastSavedAt
}

export function getPendingEditCount(): number {
  return pendingEdits
}

export function hasUnsyncedEdits(): boolean {
  return pendingEdits > 0
}

export function markPendingEdit(): void {
  pendingEdits += 1
  emitPending()
}

export function clearPendingEdits(): void {
  if (pendingEdits === 0) return
  pendingEdits = 0
  emitPending()
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

export function subscribePendingEdits(listener: PendingListener): () => void {
  pendingListeners.add(listener)
  listener(pendingEdits)
  return () => {
    pendingListeners.delete(listener)
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

export function syncStatusLabel(status: SyncStatus, pending = 0): string | null {
  switch (status) {
    case 'saving':
      return 'Saving…'
    case 'saved':
      return 'Saved'
    case 'error':
      return pending > 0
        ? `Couldn’t sync · ${pending} pending — retry`
        : 'Couldn’t sync — retry'
    case 'offline':
      return pending > 0
        ? `Offline · ${pending} pending on this device`
        : 'Offline — edits stay on this device'
    default:
      return pending > 0 ? `${pending} edit${pending === 1 ? '' : 's'} waiting to sync` : null
  }
}
