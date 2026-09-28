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

export interface BackupPayload {
  version: 1
  exportedAt: string
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  attachments: Array<Omit<Attachment, 'blob'> & { filePath?: string }>
  /** Optional page copy / labels; older backups may omit this. */
  site?: string
}
