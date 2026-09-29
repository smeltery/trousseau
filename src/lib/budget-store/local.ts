import { ensureSeeded } from '../../db/dexie'
import { leaveCloudBudget } from '../cloud/sync'
import type { BudgetStoreAdapter } from './types'

export const localBudgetStore: BudgetStoreAdapter = {
  mode: 'local',
  async boot() {
    await leaveCloudBudget()
    await ensureSeeded()
  },
}
