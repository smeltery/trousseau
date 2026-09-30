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

export function addDays(iso: string, delta: number): string {
  const d = parseDateKey(iso)
  d.setDate(d.getDate() + delta)
  return toDateKey(d)
}

export function startOfWeek(iso: string): string {
  const d = parseDateKey(iso)
  d.setDate(d.getDate() - d.getDay())
  return toDateKey(d)
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6)
  const a = parseDateKey(weekStart)
  const b = parseDateKey(end)
  const sameMonth = a.getMonth() === b.getMonth()
  const sameYear = a.getFullYear() === b.getFullYear()
  if (sameMonth) {
    return `${a.toLocaleDateString('en-US', { month: 'long' })} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`
  }
  if (sameYear) {
    return `${a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${a.getFullYear()}`
  }
  return `${a.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${b.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function monthShortLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' })
}

export type YearMonthTone = {
  year: number
  month: number
  label: string
  overdue: number
  upcoming: number
  paid: number
  total: number
}

export function yearMonthTones(
  items: LineItem[],
  year: number,
  today: string,
): YearMonthTone[] {
  return Array.from({ length: 12 }, (_, month) => {
    const stats = monthDueStats(items, year, month, today)
    return {
      year,
      month,
      label: monthShortLabel(year, month),
      ...stats,
      total: stats.overdue + stats.upcoming + stats.paid,
    }
  })
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

/** Unpaid dues on or before today, then upcoming unpaid. */
export function agendaItems(items: LineItem[], today: string, limit = 24): LineItem[] {
  return [...overdueAgendaItems(items, today), ...upcomingAgendaItems(items, today)].slice(0, limit)
}

export function overdueAgendaItems(items: LineItem[], today: string): LineItem[] {
  return itemsWithDueDates(items)
    .filter((i) => i.status !== 'paid' && i.dueDate! < today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
}

export function upcomingAgendaItems(items: LineItem[], today: string, limit = 24): LineItem[] {
  return itemsWithDueDates(items)
    .filter((i) => i.status !== 'paid' && i.dueDate! >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, limit)
}

/** Unpaid dues within the next 7 days (inclusive of today). */
export function dueThisWeekItems(items: LineItem[], today: string): LineItem[] {
  const end = addDays(today, 6)
  return itemsWithDueDates(items)
    .filter((i) => i.status !== 'paid' && i.dueDate! >= today && i.dueDate! <= end)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
}

/** Money owed with no due date set. */
export function undatedUnpaidItems(items: LineItem[]): LineItem[] {
  return items
    .filter((i) => i.status !== 'paid' && !i.dueDate && !/^budget$/i.test(i.label.trim()))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function isOverdue(item: LineItem, today: string): boolean {
  return Boolean(item.dueDate && item.status !== 'paid' && item.dueDate < today)
}

export type DayTone = 'empty' | 'paid' | 'due' | 'overdue'

/** Strongest urgency among items due on a day. */
export function dayTone(items: LineItem[], today: string): DayTone {
  if (!items.length) return 'empty'
  if (items.some((i) => isOverdue(i, today))) return 'overdue'
  if (items.some((i) => i.status !== 'paid')) return 'due'
  return 'paid'
}

export function monthDueStats(
  items: LineItem[],
  year: number,
  month: number,
  today: string,
): { overdue: number; upcoming: number; paid: number } {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  let overdue = 0
  let upcoming = 0
  let paid = 0
  for (const item of itemsWithDueDates(items)) {
    if (!item.dueDate?.startsWith(prefix)) continue
    if (item.status === 'paid') paid += 1
    else if (item.dueDate < today) overdue += 1
    else upcoming += 1
  }
  return { overdue, upcoming, paid }
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
    const alarm =
      item.status === 'paid'
        ? []
        : [
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:${summary}`,
            'TRIGGER:-P1D',
            'END:VALARM',
          ]
    return [
      'BEGIN:VEVENT',
      `UID:${item.id}@trousseau.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      item.status === 'paid' ? 'STATUS:CONFIRMED' : 'STATUS:TENTATIVE',
      ...alarm,
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
