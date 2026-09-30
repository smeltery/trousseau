import type { InstallmentStub, LineItem } from '../db/types'

export type DueKind = 'deposit' | 'balance' | `inst:${string}`

export function installmentKind(id: string): DueKind {
  return `inst:${id}`
}

export function parseInstallmentKind(kind: DueKind): string | null {
  return kind.startsWith('inst:') ? kind.slice(5) : null
}

/** Unique calendar due keys for an item (deposit + balance + installments). */
export function dueDateKeys(item: LineItem): string[] {
  const keys = new Set<string>()
  if (item.dueDate) keys.add(item.dueDate)
  if (item.remainingBalanceDueDate) keys.add(item.remainingBalanceDueDate)
  for (const inst of item.installments ?? []) {
    if (inst.date) keys.add(inst.date)
  }
  return [...keys]
}

/** Expand items due on a day into deposit / balance / installment entries. */
export function dueEntriesForDay(
  items: LineItem[],
  dateKey: string,
): Array<{ item: LineItem; kind: DueKind }> {
  const out: Array<{ item: LineItem; kind: DueKind }> = []
  for (const item of items) {
    if (item.dueDate === dateKey) out.push({ item, kind: 'deposit' })
    if (item.remainingBalanceDueDate === dateKey) out.push({ item, kind: 'balance' })
    for (const inst of item.installments ?? []) {
      if (inst.date === dateKey) out.push({ item, kind: installmentKind(inst.id) })
    }
  }
  return out
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

/** Wedding weekend window: wedding day ± 1 day when wedding is set; else this week. */
export function weddingWeekendRange(
  weddingDate: string | undefined,
  today: string,
): { start: string; end: string } {
  if (weddingDate) {
    return { start: addDaysIso(weddingDate, -1), end: addDaysIso(weddingDate, 1) }
  }
  return { start: today, end: addDaysIso(today, 6) }
}

export function cashDueWeddingWeekend(
  items: LineItem[],
  weddingDate: string | undefined,
  today: string,
): number {
  const { start, end } = weddingWeekendRange(weddingDate, today)
  return cashDueInRange(items, start, end)
}

/** Remaining dues through wedding vs funds left, with optional monthly pace. */
export function cashRunway(
  items: LineItem[],
  fundsLeft: number,
  weddingDate: string | undefined,
  today: string,
): {
  duesBeforeWedding: number
  fundsLeft: number
  months: number
  monthlyPace: number
  short: boolean
} | null {
  if (!weddingDate || weddingDate < today) return null
  const duesBeforeWedding = cashDueInRange(items, today, weddingDate)
  if (duesBeforeWedding <= 0) return null
  const days = Math.round(
    (new Date(`${weddingDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) /
      86400000,
  )
  const months = Math.max(1, days / 30.44)
  return {
    duesBeforeWedding,
    fundsLeft,
    months,
    monthlyPace: duesBeforeWedding / months,
    short: duesBeforeWedding > fundsLeft,
  }
}

export function sortInstallments(list: InstallmentStub[]): InstallmentStub[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
