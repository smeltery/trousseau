import type { LineItem } from '../db/types'

/** Local calendar day key YYYY-MM-DD (noon to avoid TZ edge cases). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function parseDateKey(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export type MonthCell = { key: string | null; day: number | null }

/** Sunday-start grid covering the visible month. */
export function monthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: MonthCell[] = []
  for (let i = 0; i < startPad; i++) cells.push({ key: null, day: null })
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: toDateKey(new Date(year, month, day)), day })
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null })
  return cells
}

export function itemsWithDueDates(items: LineItem[]): LineItem[] {
  return items.filter((i) => Boolean(i.dueDate))
}

export function groupByDueDate(items: LineItem[]): Map<string, LineItem[]> {
  const map = new Map<string, LineItem[]>()
  for (const item of itemsWithDueDates(items)) {
    const key = item.dueDate!
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.label.localeCompare(b.label))
  }
  return map
}

/** Unpaid dues on or before today, then upcoming unpaid, then paid in range. */
export function agendaItems(items: LineItem[], today: string, limit = 8): LineItem[] {
  const dated = itemsWithDueDates(items)
  const unpaid = dated.filter((i) => i.status !== 'paid')
  const overdue = unpaid
    .filter((i) => i.dueDate! < today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const upcoming = unpaid
    .filter((i) => i.dueDate! >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  return [...overdue, ...upcoming].slice(0, limit)
}

export function isOverdue(item: LineItem, today: string): boolean {
  return Boolean(item.dueDate && item.status !== 'paid' && item.dueDate < today)
}

function nextDateKey(iso: string): string {
  const d = parseDateKey(iso)
  d.setDate(d.getDate() + 1)
  return toDateKey(d)
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsStamp(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Build an .ics calendar of expense due dates for Apple / Google / Outlook. */
export function buildDueDatesIcs(
  items: LineItem[],
  categoryName: (categoryId: string) => string,
): string {
  const dated = itemsWithDueDates(items).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const stamp = icsStamp()
  const events = dated.map((item) => {
    const start = item.dueDate!.replace(/-/g, '')
    const end = nextDateKey(item.dueDate!).replace(/-/g, '')
    const cat = categoryName(item.categoryId)
    const summary = icsEscape(`${cat}: ${item.label}`)
    const desc = icsEscape(
      [`Amount: ${item.amount}`, `Paid: ${item.paidAmount}`, `Status: ${item.status}`, item.notes?.trim()]
        .filter(Boolean)
        .join('\n'),
    )
    return [
      'BEGIN:VEVENT',
      `UID:${item.id}@trousseau.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      item.status === 'paid' ? 'STATUS:CONFIRMED' : 'STATUS:TENTATIVE',
      'END:VEVENT',
    ].join('\r\n')
  })
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trousseau//Budget Due Dates//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Trousseau due dates',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
