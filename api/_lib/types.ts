/** Mirror of src/db/types BackupPayload for API handlers (no app imports). */

export type FundType = 'gift' | 'savings'
export type CategoryGroup = 'venue' | 'vendor' | 'reimbursement'
export type LineStatus = 'planned' | 'deposit' | 'partial' | 'paid'
export type AttachmentKind = 'file' | 'link'
export type AttachmentRole = 'contract' | 'invoice' | 'receipt'

export type WhoPays = 'left' | 'right' | 'joint'

export interface PaymentStub {
  id: string
  amount: number
  date: string
  note?: string
  method?: string
  fundId?: string
}

export interface InstallmentStub {
  id: string
  amount: number
  date: string
  note?: string
}

export interface FundContribution {
  id: string
  amount: number
  date: string
  note?: string
}

export interface Fund {
  id: string
  label: string
  amount: number
  type: FundType
  sort: number
  source?: string
  receivedDate?: string
  thanked?: boolean
  earmarkCategoryId?: string
  contributions?: FundContribution[]
}

export interface Category {
  id: string
  name: string
  group: CategoryGroup
  sort: number
  archived?: boolean
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
  remainingBalanceDueDate?: string
  payments?: PaymentStub[]
  installments?: InstallmentStub[]
  expectedBackDate?: string
  backReceived?: boolean
  dueOffsetDays?: number
  balanceOffsetDays?: number
  expectedBackOffsetDays?: number
  whoPays?: WhoPays
  whoPaysLeft?: number
  whoPaysRight?: number
  quotedAmount?: number
  perGuestAmount?: number
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
  role?: AttachmentRole
  createdAt: string
  /** Server-only: Blob pathname for deletion. */
  blobPathname?: string
}

export interface BackupPayload {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7
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
