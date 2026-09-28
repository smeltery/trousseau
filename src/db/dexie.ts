import Dexie, { type EntityTable } from 'dexie'
import type { Attachment, Category, Fund, LineItem, Meta } from './types'

class TrousseauDB extends Dexie {
  funds!: EntityTable<Fund, 'id'>
  categories!: EntityTable<Category, 'id'>
  lineItems!: EntityTable<LineItem, 'id'>
  attachments!: EntityTable<Attachment, 'id'>
  meta!: EntityTable<Meta, 'key'>

  constructor() {
    super('trousseau')
    this.version(1).stores({
      funds: 'id, type, sort',
      categories: 'id, group, sort',
      lineItems: 'id, categoryId, status, sort',
      attachments: 'id, lineItemId, kind',
      meta: 'key',
    })
  }
}

export const db = new TrousseauDB()

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export {
  ensureSeeded,
  loadDemoSample,
  resetToBlank,
  resetToSeed,
} from './budget-lifecycle'
