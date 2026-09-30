export type FundType = 'gift' | 'savings'
export type CategoryGroup = 'venue' | 'vendor' | 'reimbursement'
export type LineStatus = 'planned' | 'deposit' | 'partial' | 'paid'
export type AttachmentKind = 'file' | 'link'
export type AttachmentRole = 'contract' | 'invoice' | 'receipt'

export type WhoPays = 'left' | 'right' | 'joint'

export interface PaymentStub {
  id: string
  amount: number
  /** YYYY-MM-DD */
  date: string
  /** Optional short note (e.g. check number). */
  note?: string
  /** Optional method label (Cash, Check, Card…). */
  method?: string
  /** Optional gift/savings fund this payment drew from. */
  fundId?: string
}

/** Extra dated installment beyond deposit / remaining balance. */
export interface InstallmentStub {
  id: string
  amount: number
  /** YYYY-MM-DD */
  date: string
  note?: string
}

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
  /** Gift thank-you sent (optional). */
  thanked?: boolean
  /** Optional category this gift is earmarked to cover. */
  earmarkCategoryId?: string
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
  /** Balance remaining due date (deposit vs final). */
  remainingBalanceDueDate?: string
  /** Dated payment stubs when recording payments. */
  payments?: PaymentStub[]
  /** Extra dated installments beyond deposit/balance. */
  installments?: InstallmentStub[]
  /** Reimbursement expected-back date. */
  expectedBackDate?: string
  /** Reimbursement marked received. */
  backReceived?: boolean
  /** Days before wedding for dueDate (positive = before). */
  dueOffsetDays?: number
  /** Days before wedding for remainingBalanceDueDate. */
  balanceOffsetDays?: number
  /** Days after wedding for expectedBackDate (positive = after). */
  expectedBackOffsetDays?: number
  /** Who is covering this line (couple left / right / joint). */
  whoPays?: WhoPays
  /** Dollar amount left partner covers (optional split beyond tags). */
  whoPaysLeft?: number
  /** Dollar amount right partner covers (optional split beyond tags). */
  whoPaysRight?: number
  /** Original quote / estimate kept when amount becomes contracted. */
  quotedAmount?: number
  /** $/guest for plate-style lines; amount tracks site guestCount × this. */
  perGuestAmount?: number
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
  /** Optional document role for sorting / wrap views. */
  role?: AttachmentRole
  createdAt: string
}

export interface Meta {
  key: string
  value: string
}

/** Backup / cloud snapshot shape. v1–v6 accepted on import. */
export interface BackupPayload {
  version: 1 | 2 | 3 | 4 | 5 | 6
  exportedAt: string
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  attachments: Array<Omit<Attachment, 'blob'> & { filePath?: string }>
  /** Optional page copy / labels; older backups may omit this. */
  site?: string
}
