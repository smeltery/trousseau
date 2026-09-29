import { sql } from '@vercel/postgres'
import { del } from '@vercel/blob'
import type { AttachmentMeta, BackupPayload, Category, CloudSnapshot, Fund, LineItem } from './types.js'
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
        await del(row.blob_pathname)
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
      INSERT INTO funds (id, budget_id, label, amount, type, sort)
      VALUES (${fund.id}, ${budgetId}, ${fund.label}, ${fund.amount}, ${fund.type}, ${fund.sort})
    `
  }
  for (const cat of payload.categories) {
    await sql`
      INSERT INTO categories (id, budget_id, name, "group", sort)
      VALUES (${cat.id}, ${budgetId}, ${cat.name}, ${cat.group}, ${cat.sort})
    `
  }
  for (const item of payload.lineItems) {
    await sql`
      INSERT INTO line_items (
        id, budget_id, category_id, label, amount, paid_amount, status, due_date, notes, sort
      )
      VALUES (
        ${item.id}, ${budgetId}, ${item.categoryId}, ${item.label}, ${item.amount},
        ${item.paidAmount}, ${item.status}, ${item.dueDate ?? null}, ${item.notes ?? null}, ${item.sort}
      )
    `
  }
  for (const att of payload.attachments) {
    await sql`
      INSERT INTO attachments (
        id, budget_id, line_item_id, kind, name, url, mime, size, blob_pathname, created_at
      )
      VALUES (
        ${att.id}, ${budgetId}, ${att.lineItemId}, ${att.kind}, ${att.name},
        ${att.url ?? null}, ${att.mime ?? null}, ${att.size ?? null},
        ${att.blobPathname ?? null}, ${att.createdAt}
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

  const funds = await sql<Fund & { budget_id: string }>`
    SELECT id, label, amount, type, sort FROM funds WHERE budget_id = ${budgetId} ORDER BY sort
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
    sort: number
  }>`
    SELECT id, category_id, label, amount, paid_amount, status, due_date, notes, sort
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
    created_at: string
  }>`
    SELECT id, line_item_id, kind, name, url, mime, size, blob_pathname, created_at
    FROM attachments WHERE budget_id = ${budgetId}
  `

  return {
    version: 1,
    exportedAt: b.updated_at.toISOString(),
    updatedAt: b.updated_at.toISOString(),
    site: b.site ?? undefined,
    funds: funds.rows.map((f) => ({
      id: f.id,
      label: f.label,
      amount: Number(f.amount),
      type: f.type,
      sort: f.sort,
    })),
    categories: categories.rows.map((c) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      sort: c.sort,
    })),
    lineItems: lineItems.rows.map((i) => ({
      id: i.id,
      categoryId: i.category_id,
      label: i.label,
      amount: Number(i.amount),
      paidAmount: Number(i.paid_amount),
      status: i.status as LineItem['status'],
      dueDate: i.due_date ?? undefined,
      notes: i.notes ?? undefined,
      sort: i.sort,
    })),
    attachments: attachments.rows.map(
      (a): AttachmentMeta => ({
        id: a.id,
        lineItemId: a.line_item_id,
        kind: a.kind as AttachmentMeta['kind'],
        name: a.name,
        url: a.url ?? undefined,
        mime: a.mime ?? undefined,
        size: a.size != null ? Number(a.size) : undefined,
        createdAt: a.created_at,
        blobPathname: a.blob_pathname ?? undefined,
      }),
    ),
  }
}

export async function insertAttachment(
  budgetId: string,
  att: AttachmentMeta,
): Promise<void> {
  await sql`
    INSERT INTO attachments (
      id, budget_id, line_item_id, kind, name, url, mime, size, blob_pathname, created_at
    )
    VALUES (
      ${att.id}, ${budgetId}, ${att.lineItemId}, ${att.kind}, ${att.name},
      ${att.url ?? null}, ${att.mime ?? null}, ${att.size ?? null},
      ${att.blobPathname ?? null}, ${att.createdAt}
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
      await del(rows[0].blob_pathname)
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
    v.version === 1 &&
    Array.isArray(v.funds) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.lineItems) &&
    Array.isArray(v.attachments)
  )
}
