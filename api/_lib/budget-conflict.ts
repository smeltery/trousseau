import { sql } from './db.js'

/** Throw 412-shaped error when If-Match does not equal current updated_at. */
export async function assertBudgetIfMatch(
  budgetId: string,
  ifMatch?: string | null,
): Promise<void> {
  if (!ifMatch) return
  const { rows } = await sql<{ updated_at: Date }>`
    SELECT updated_at FROM budgets WHERE id = ${budgetId}
  `
  const iso = rows[0]?.updated_at?.toISOString()
  if (iso && iso !== ifMatch) {
    throw Object.assign(new Error('Precondition Failed'), {
      statusCode: 412 as const,
      updatedAt: iso,
    })
  }
}
