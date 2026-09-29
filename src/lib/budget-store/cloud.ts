import { enterCloudBudget, leaveCloudBudget } from '../cloud/sync'
import type { BudgetStoreAdapter } from './types'

export const cloudBudgetStore: BudgetStoreAdapter = {
  mode: 'cloud',
  async boot(token?: string) {
    if (!token) throw new Error('Cloud budget requires a share token')
    await enterCloudBudget(token)
  },
  teardown: leaveCloudBudget,
}
