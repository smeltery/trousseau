/** Local vs remote label maps for a short partner-pull summary. */

export type LabelSnapshot = {
  expenses: Record<string, string>
  funds: Record<string, string>
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

function collectDiffs(before: Record<string, string>, after: Record<string, string>): string[] {
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

/** Labels that were added, removed, or renamed (new label for renames). */
export function diffPartnerLabels(before: LabelSnapshot, after: LabelSnapshot): string[] {
  return [
    ...collectDiffs(before.expenses, after.expenses),
    ...collectDiffs(before.funds, after.funds),
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
