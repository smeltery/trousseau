export type BudgetStoreMode = 'local' | 'cloud'

export interface BudgetStoreAdapter {
  mode: BudgetStoreMode
  boot: (token?: string) => Promise<void>
  teardown?: () => Promise<void>
}
