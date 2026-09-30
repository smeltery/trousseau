import { useEffect } from 'react'
import { pullCloudBudgetIfStale } from '../cloud/sync'
import { getSyncStatus, hasUnsyncedEdits } from '../sync-status'

/** Partner pull on focus, plus leave warning when unsynced edits exist. */
export function useCloudFocusAndUnload(ready: boolean, cloudMode: boolean): void {
  useEffect(() => {
    if (!ready || !cloudMode) return
    async function onFocus() {
      try {
        await pullCloudBudgetIfStale()
      } catch {
        // Offline / transient: keep local cache.
      }
    }
    function onVis() {
      if (document.visibilityState === 'visible') void onFocus()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ready, cloudMode])

  useEffect(() => {
    if (!ready) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsyncedEdits() || getSyncStatus() === 'saving') return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [ready])
}
