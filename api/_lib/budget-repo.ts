import { sql } from './db.js'
import { deleteBlob } from './blob-store.js'
import {
  mapAttachmentRow,
  mapCategoryRow,
  mapFundRow,
  mapLineItemRow,
} from './budget-map.js'
import type {
  AttachmentMeta,
  BackupPayload,
  Category,
  CloudSnapshot,
  Fund,
} from './types.js'
import { hashToken, newShareToken } from './token.js'

function newBudgetId(): string {
  return `bud-${crypto.randomUUID().slice(0, 12)}`
}

export async function resolveBudgetId(token: string): Promise<string | null> {
  const tokenHash = hashToken(token)
  const { rows } = await sql<{ id: string }>`
    SELECT id FROM budgets WHERE token_hash = ${tokenHash} LIMIT 1
  `
  return rows[0]?.id ?? null
}

export async function createBudget(payload: BackupPayload): Promise<{ id: string; token: string }> {
  const id = newBudgetId()
  const token = newShareToken()
  const tokenHash = hashToken(token)
  const site = payload.site ?? null

  await sql`
    INSERT INTO budgets (id, token_hash, site)
    VALUES (${id}, ${tokenHash}, ${site})
  `
  await replaceChildren(id, payload)
  return { id, token }
}

export async function replaceBudget(budgetId: string, payload: BackupPayload): Promise<string> {
  const site = payload.site ?? null
  await sql`
    UPDATE budgets
    SET site = ${site}, updated_at = NOW()
    WHERE id = ${budgetId}
  `
  await replaceChildren(budgetId, payload)
  const { rows } = await sql<{ updated_at: Date }>`
    SELECT updated_at FROM budgets WHERE id = ${budgetId}
  `
  return rows[0]?.updated_at?.toISOString() ?? new Date().toISOString()
}

async function replaceChildren(budgetId: string, payload: BackupPayload): Promise<void> {
  const existing = await sql<{ blob_pathname: string | null }>`
    SELECT blob_pathname FROM attachments
    WHERE budget_id = ${budgetId} AND blob_pathname IS NOT NULL
  `
  const keepPaths = new Set(
    payload.attachments.map((a) => a.blobPathname).filter((p): p is string => Boolean(p)),
  )
  for (const row of existing.rows) {
    if (row.blob_pathname && !keepPaths.has(row.blob_pathname)) {
      try {
        await deleteBlob(row.blob_pathname)
      } catch {
        // Blob may already be gone.
      }
    }
  }

  await sql`DELETE FROM attachments WHERE budget_id = ${budgetId}`
  await sql`DELETE FROM line_items WHERE budget_id = ${budgetId}`
  await sql`DELETE FROM categories WHERE budget_id = ${budgetId}`
  await sql`DELETE FROM funds WHERE budget_id = ${budgetId}`

  for (const fund of payload.funds) {
    await sql`
      INSERT INTO funds (
        id, budget_id, label, amount, type, sort, source, received_date, thanked, earmark_category_id
      )
      VALUES (
        ${fund.id}, ${budgetId}, ${fund.label}, ${fund.amount}, ${fund.type}, ${fund.sort},
        ${fund.source ?? null}, ${fund.receivedDate ?? null}, ${fund.thanked ?? null},
        ${fund.earmarkCategoryId ?? null}
      )
    `
  }
  for (const cat of payload.categories) {
    await sql`
      INSERT INTO categories (id, budget_id, name, "group", sort)
      VALUES (${cat.id}, ${budgetId}, ${cat.name}, ${cat.group}, ${cat.sort})
    `
  }
  for (const item of payload.lineItems) {
    const paymentsJson = item.payments?.length ? JSON.stringify(item.payments) : null
    const installmentsJson = item.installments?.length ? JSON.stringify(item.installments) : null
    await sql`
      INSERT INTO line_items (
        id, budget_id, category_id, label, amount, paid_amount, status, due_date, notes, vendor_url, sort,
        remaining_balance_due_date, payments, installments, expected_back_date, back_received, due_offset_days,
        balance_offset_days, expected_back_offset_days, who_pays, who_pays_left, who_pays_right,
        quoted_amount, per_guest_amount
      )
      VALUES (
        ${item.id}, ${budgetId}, ${item.categoryId}, ${item.label}, ${item.amount},
        ${item.paidAmount}, ${item.status}, ${item.dueDate ?? null}, ${item.notes ?? null},
        ${item.vendorUrl ?? null}, ${item.sort},
        ${item.remainingBalanceDueDate ?? null}, ${paymentsJson}, ${installmentsJson},
        ${item.expectedBackDate ?? null}, ${item.backReceived ?? null},
        ${item.dueOffsetDays ?? null}, ${item.balanceOffsetDays ?? null},
        ${item.expectedBackOffsetDays ?? null},
        ${item.whoPays ?? null}, ${item.whoPaysLeft ?? null}, ${item.whoPaysRight ?? null},
        ${item.quotedAmount ?? null}, ${item.perGuestAmount ?? null}
      )
    `
  }
  for (const att of payload.attachments) {
    await sql`
      INSERT INTO attachments (
        id, budget_id, line_item_id, kind, name, url, mime, size, blob_pathname, role, created_at
      )
      VALUES (
        ${att.id}, ${budgetId}, ${att.lineItemId}, ${att.kind}, ${att.name},
        ${att.url ?? null}, ${att.mime ?? null}, ${att.size ?? null},
        ${att.blobPathname ?? null}, ${att.role ?? null}, ${att.createdAt}
      )
    `
  }
}

export async function loadSnapshot(budgetId: string): Promise<CloudSnapshot> {
  const budget = await sql<{ site: string | null; updated_at: Date }>`
    SELECT site, updated_at FROM budgets WHERE id = ${budgetId}
  `
  const b = budget.rows[0]
  if (!b) throw new Error('Budget not found')

  const funds = await sql<{
    id: string
    label: string
    amount: number
    type: Fund['type']
    sort: number
    source: string | null
    received_date: string | null
    thanked: boolean | null
    earmark_category_id: string | null
  }>`
    SELECT id, label, amount, type, sort, source, received_date, thanked, earmark_category_id
    FROM funds WHERE budget_id = ${budgetId} ORDER BY sort
  `
  const categories = await sql<Category & { budget_id: string }>`
    SELECT id, name, "group", sort FROM categories WHERE budget_id = ${budgetId} ORDER BY sort
  `
  const lineItems = await sql<{
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
    expected_back_offset_days: number | null
    who_pays: string | null
    who_pays_left: number | null
    who_pays_right: number | null
    quoted_amount: number | null
    per_guest_amount: number | null
  }>`
    SELECT id, category_id, label, amount, paid_amount, status, due_date, notes, vendor_url, sort,
      remaining_balance_due_date, payments, installments, expected_back_date, back_received, due_offset_days,
      balance_offset_days, expected_back_offset_days, who_pays, who_pays_left, who_pays_right,
      quoted_amount, per_guest_amount
    FROM line_items WHERE budget_id = ${budgetId} ORDER BY sort
  `
  const attachments = await sql<{
    id: string
    line_item_id: string
    kind: string
    name: string
    url: string | null
    mime: string | null
    size: number | null
    blob_pathname: string | null
    role: string | null
    created_at: string
  }>`
    SELECT id, line_item_id, kind, name, url, mime, size, blob_pathname, role, created_at
    FROM attachments WHERE budget_id = ${budgetId}
  `

  return {
    version: 6,
    exportedAt: b.updated_at.toISOString(),
    updatedAt: b.updated_at.toISOString(),
    site: b.site ?? undefined,
    funds: funds.rows.map(mapFundRow),
    categories: categories.rows.map(mapCategoryRow),
    lineItems: lineItems.rows.map(mapLineItemRow),
    attachments: attachments.rows.map(mapAttachmentRow),
  }
}

export async function insertAttachment(
  budgetId: string,
  att: AttachmentMeta,
): Promise<void> {
  await sql`
    INSERT INTO attachments (
      id, budget_id, line_item_id, kind, name, url, mime, size, blob_pathname, role, created_at
    )
    VALUES (
      ${att.id}, ${budgetId}, ${att.lineItemId}, ${att.kind}, ${att.name},
      ${att.url ?? null}, ${att.mime ?? null}, ${att.size ?? null},
      ${att.blobPathname ?? null}, ${att.role ?? null}, ${att.createdAt}
    )
  `
  await sql`UPDATE budgets SET updated_at = NOW() WHERE id = ${budgetId}`
}

export async function deleteAttachment(
  budgetId: string,
  attachmentId: string,
): Promise<boolean> {
  const { rows } = await sql<{ blob_pathname: string | null }>`
    SELECT blob_pathname FROM attachments
    WHERE budget_id = ${budgetId} AND id = ${attachmentId}
  `
  if (!rows[0]) return false
  if (rows[0].blob_pathname) {
    try {
      await deleteBlob(rows[0].blob_pathname)
    } catch {
      // ignore
    }
  }
  await sql`
    DELETE FROM attachments WHERE budget_id = ${budgetId} AND id = ${attachmentId}
  `
  await sql`UPDATE budgets SET updated_at = NOW() WHERE id = ${budgetId}`
  return true
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as BackupPayload
  return (
    (v.version === 1 ||
      v.version === 2 ||
      v.version === 3 ||
      v.version === 4 ||
      v.version === 5 ||
      v.version === 6) &&
    Array.isArray(v.funds) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.lineItems) &&
    Array.isArray(v.attachments)
  )
}
