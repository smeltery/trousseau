import { showToast } from './toast'
import { scheduleCloudPush } from './cloud/sync'

/** Run a Dexie write; toast on quota / storage failures; schedule cloud push when shared. */
export async function dbWrite<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const result = await fn()
    scheduleCloudPush()
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/QuotaExceeded|quota/i.test(msg) || (err instanceof DOMException && err.name === 'QuotaExceededError')) {
      showToast('Storage is full. Export a backup or free space.')
    } else {
      showToast('Could not save. Try again.')
    }
    console.error(err)
    return undefined
  }
}
