/** Mirror of src/db/types BackupPayload for API handlers (no app imports). */

export type FundType = 'gift' | 'savings'
export type CategoryGroup = 'venue' | 'vendor' | 'reimbursement'
export type LineStatus = 'planned' | 'deposit' | 'partial' | 'paid'
export type AttachmentKind = 'file' | 'link'

export interface Fund {
  id: string
  label: string
  amount: number
  type: FundType
  sort: number
  source?: string
  receivedDate?: string
}

export interface Category {
  id: string
  name: string
  group: CategoryGroup
  sort: number
}

export interface LineItem {
  id: string
  categoryId: string
  label: string
  amount: number
  paidAmount: number
  status: LineStatus
  dueDate?: string
  notes?: string
  vendorUrl?: string
  sort: number
}

export interface AttachmentMeta {
  id: string
  lineItemId: string
  kind: AttachmentKind
  name: string
  url?: string
  mime?: string
  size?: number
  createdAt: string
  /** Server-only: Blob pathname for deletion. */
  blobPathname?: string
}

export interface BackupPayload {
  version: 1 | 2
  exportedAt: string
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  attachments: AttachmentMeta[]
  site?: string
}

export interface CloudSnapshot extends BackupPayload {
  updatedAt: string
}
