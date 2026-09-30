/** Local vs remote snapshots for partner-pull summaries. */

export type LabelSnapshot = {
  expenses: Record<string, string>
  funds: Record<string, string>
}

export type MoneyRow = {
  label: string
  amount: number
  paidAmount?: number
  status?: string
}

export type MoneySnapshot = {
  expenses: Record<string, MoneyRow>
  funds: Record<string, MoneyRow>
}

export function labelsFromRows(
  expenses: Array<{ id: string; label: string }>,
  funds: Array<{ id: string; label: string }>,
): LabelSnapshot {
  return {
    expenses: Object.fromEntries(expenses.map((e) => [e.id, e.label])),
    funds: Object.fromEntries(funds.map((f) => [f.id, f.label])),
  }
}

export function moneyFromRows(
  expenses: Array<{ id: string; label: string; amount: number; paidAmount: number; status: string }>,
  funds: Array<{ id: string; label: string; amount: number }>,
): MoneySnapshot {
  return {
    expenses: Object.fromEntries(
      expenses.map((e) => [
        e.id,
        { label: e.label, amount: e.amount, paidAmount: e.paidAmount, status: e.status },
      ]),
    ),
    funds: Object.fromEntries(
      funds.map((f) => [f.id, { label: f.label, amount: f.amount }]),
    ),
  }
}

function collectLabelDiffs(before: Record<string, string>, after: Record<string, string>): string[] {
  const out: string[] = []
  for (const [id, label] of Object.entries(after)) {
    const prev = before[id]
    if (prev === undefined || prev !== label) out.push(label)
  }
  for (const [id, label] of Object.entries(before)) {
    if (!(id in after)) out.push(label)
  }
  return out
}

function fmtAmt(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function collectMoneyDiffs(
  before: Record<string, MoneyRow>,
  after: Record<string, MoneyRow>,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const [id, row] of Object.entries(after)) {
    const prev = before[id]
    if (!prev) {
      out.push(row.label)
      seen.add(id)
      continue
    }
    const bits: string[] = []
    if (prev.amount !== row.amount) bits.push(`${fmtAmt(prev.amount)}→${fmtAmt(row.amount)}`)
    if (
      prev.paidAmount != null &&
      row.paidAmount != null &&
      prev.paidAmount !== row.paidAmount
    ) {
      bits.push(`paid ${fmtAmt(prev.paidAmount)}→${fmtAmt(row.paidAmount)}`)
    }
    if (prev.status && row.status && prev.status !== row.status) bits.push(row.status)
    if (prev.label !== row.label) bits.push(row.label)
    if (bits.length) {
      out.push(bits[0]!.includes('→') || bits[0] === row.status ? `${row.label} (${bits.join(', ')})` : row.label)
      seen.add(id)
    }
  }
  for (const [id, row] of Object.entries(before)) {
    if (!(id in after) && !seen.has(id)) out.push(row.label)
  }
  return out
}

/** Labels that were added, removed, or renamed (new label for renames). */
export function diffPartnerLabels(before: LabelSnapshot, after: LabelSnapshot): string[] {
  return [
    ...collectLabelDiffs(before.expenses, after.expenses),
    ...collectLabelDiffs(before.funds, after.funds),
  ]
}

/** Labels plus amount/status changes for a richer partner toast. */
export function diffPartnerMoney(before: MoneySnapshot, after: MoneySnapshot): string[] {
  return [
    ...collectMoneyDiffs(before.expenses, after.expenses),
    ...collectMoneyDiffs(before.funds, after.funds),
  ]
}

/** e.g. "Partner updated: Venue deposit, New gift +2 more" */
export function formatPartnerChangesMessage(labels: string[], max = 5): string | null {
  if (labels.length === 0) return null
  const shown = labels.slice(0, max)
  const rest = labels.length - shown.length
  const list = rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
  return `Partner updated: ${list}`
}
