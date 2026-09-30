import type { NavigateFunction } from 'react-router-dom'
import { loadDemoSample, resetToBlank } from '../db/dexie'
import { goToSharedBudget } from './cloud/navigate'
import { clearRememberedShareToken } from './cloud/session'
import { enterCloudBudget, leaveCloudBudget, publishShareLink } from './cloud/sync'
import { dbWrite } from './db-write'
import { queueCelebrate } from './pending-celebrate'

/** Wipe local budget, publish a fresh share link, and navigate to it. */
export async function replaceBudgetAndShare(
  kind: 'blank' | 'demo',
  navigate: NavigateFunction,
): Promise<void> {
  await leaveCloudBudget()
  clearRememberedShareToken()
  await dbWrite(() => (kind === 'blank' ? resetToBlank() : loadDemoSample()))
  const share = await publishShareLink()
  try {
    await navigator.clipboard.writeText(share.url)
  } catch {
    // Navigation still lands on the new link.
  }
  await enterCloudBudget(share.token)
  queueCelebrate(kind === 'blank' ? 'Blank budget ready' : 'Demo sample loaded')
  goToSharedBudget(share.token, navigate)
}
