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
  /** Gift giver / source (optional). */
  source?: string
  /** When the gift or savings was received (YYYY-MM-DD). */
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
  /** Vendor site or booking link (optional). */
  vendorUrl?: string
  sort: number
}

export interface Attachment {
  id: string
  lineItemId: string
  kind: AttachmentKind
  name: string
  url?: string
  mime?: string
  size?: number
  blob?: Blob
  createdAt: string
}

export interface Meta {
  key: string
  value: string
}

/** Backup / cloud snapshot shape. v1 and v2 are both accepted on import. */
export interface BackupPayload {
  version: 1 | 2
  exportedAt: string
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  attachments: Array<Omit<Attachment, 'blob'> & { filePath?: string }>
  /** Optional page copy / labels; older backups may omit this. */
  site?: string
}
