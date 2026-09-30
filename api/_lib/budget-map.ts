import type { AttachmentMeta, Category, Fund, InstallmentStub, LineItem, PaymentStub } from './types.js'

export function parsePayments(raw: string | null): PaymentStub[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as PaymentStub[]
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function parseInstallments(raw: string | null): InstallmentStub[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as InstallmentStub[]
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function mapFundRow(f: {
  id: string
  label: string
  amount: number
  type: Fund['type']
  sort: number
  source: string | null
  received_date: string | null
  thanked: boolean | null
  earmark_category_id: string | null
}): Fund {
  return {
    id: f.id,
    label: f.label,
    amount: Number(f.amount),
    type: f.type,
    sort: f.sort,
    source: f.source ?? undefined,
    receivedDate: f.received_date ?? undefined,
    thanked: f.thanked ?? undefined,
    earmarkCategoryId: f.earmark_category_id ?? undefined,
  }
}

export function mapCategoryRow(c: Category): Category {
  return { id: c.id, name: c.name, group: c.group, sort: c.sort }
}

export function mapLineItemRow(i: {
  id: string
  category_id: string
  label: string
  amount: number
  paid_amount: number
  status: string
  due_date: string | null
  notes: string | null
  vendor_url: string | null
  sort: number
  remaining_balance_due_date: string | null
  payments: string | null
  installments: string | null
  expected_back_date: string | null
  back_received: boolean | null
  due_offset_days: number | null
  balance_offset_days: number | null
  who_pays: string | null
}): LineItem {
  return {
    id: i.id,
    categoryId: i.category_id,
    label: i.label,
    amount: Number(i.amount),
    paidAmount: Number(i.paid_amount),
    status: i.status as LineItem['status'],
    dueDate: i.due_date ?? undefined,
    notes: i.notes ?? undefined,
    vendorUrl: i.vendor_url ?? undefined,
    sort: i.sort,
    remainingBalanceDueDate: i.remaining_balance_due_date ?? undefined,
    payments: parsePayments(i.payments),
    installments: parseInstallments(i.installments),
    expectedBackDate: i.expected_back_date ?? undefined,
    backReceived: i.back_received ?? undefined,
    dueOffsetDays: i.due_offset_days ?? undefined,
    balanceOffsetDays: i.balance_offset_days ?? undefined,
    whoPays: (i.who_pays as LineItem['whoPays']) ?? undefined,
  }
}

export function mapAttachmentRow(a: {
  id: string
  line_item_id: string
  kind: string
  name: string
  url: string | null
  mime: string | null
  size: number | null
  blob_pathname: string | null
  created_at: string
}): AttachmentMeta {
  return {
    id: a.id,
    lineItemId: a.line_item_id,
    kind: a.kind as AttachmentMeta['kind'],
    name: a.name,
    url: a.url ?? undefined,
    mime: a.mime ?? undefined,
    size: a.size != null ? Number(a.size) : undefined,
    createdAt: a.created_at,
    blobPathname: a.blob_pathname ?? undefined,
  }
}
