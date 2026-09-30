import type { LineItem } from '../db/types'

/** Unique calendar due keys for an item (deposit + remaining balance). */
export function dueDateKeys(item: LineItem): string[] {
  const keys = new Set<string>()
  if (item.dueDate) keys.add(item.dueDate)
  if (item.remainingBalanceDueDate) keys.add(item.remainingBalanceDueDate)
  return [...keys]
}

export function earliestDueDate(item: LineItem): string | undefined {
  const keys = dueDateKeys(item)
  if (!keys.length) return undefined
  return keys.sort()[0]
}

/** Remaining balance; budget category lines ignored. */
export function remainingDue(item: LineItem): number {
  if (/^budget$/i.test(item.label.trim())) return 0
  return Math.max(0, item.amount - item.paidAmount)
}

/** Sum remainingDue for unpaid dated items with a due in [start, end]. */
export function cashDueInRange(items: LineItem[], start: string, end: string): number {
  let total = 0
  for (const item of items) {
    if (item.status === 'paid') continue
    const rem = remainingDue(item)
    if (rem <= 0) continue
    if (dueDateKeys(item).some((d) => d >= start && d <= end)) total += rem
  }
  return total
}

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function cashDueThisWeek(items: LineItem[], today: string): number {
  return cashDueInRange(items, today, addDaysIso(today, 6))
}

/** Cash due in the calendar month containing today. */
export function cashDueThisMonth(items: LineItem[], today: string): number {
  const d = new Date(`${today}T12:00:00`)
  const y = d.getFullYear()
  const m = d.getMonth()
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const last = new Date(y, m + 1, 0).getDate()
  const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return cashDueInRange(items, start, end)
}
