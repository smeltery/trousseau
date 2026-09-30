import type { LineItem } from '../db/types'
import {
  dueDateKeys,
  earliestDueDate,
  remainingDue,
} from './calendar-dues'

export type { DueKind } from './calendar-dues'
export {
  cashDueInRange,
  cashDueThisMonth,
  cashDueThisWeek,
  cashRunway,
  dueDateKeys,
  dueEntriesForDay,
  earliestDueDate,
  remainingDue,
} from './calendar-dues'

export { buildDueDatesIcs } from './calendar-ics'

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

export function yearMonthTones(items: LineItem[], year: number, today: string): YearMonthTone[] {
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
  return items.filter((i) => dueDateKeys(i).length > 0)
}

export function groupByDueDate(items: LineItem[]): Map<string, LineItem[]> {
  const map = new Map<string, LineItem[]>()
  for (const item of itemsWithDueDates(items)) {
    for (const key of dueDateKeys(item)) {
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
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
    .filter((i) => isOverdue(i, today))
    .sort((a, b) => (earliestDueDate(a) ?? '').localeCompare(earliestDueDate(b) ?? ''))
}

export function upcomingAgendaItems(items: LineItem[], today: string, limit = 24): LineItem[] {
  return itemsWithDueDates(items)
    .filter((i) => i.status !== 'paid' && remainingDue(i) > 0 && !isOverdue(i, today))
    .sort((a, b) => (earliestDueDate(a) ?? '').localeCompare(earliestDueDate(b) ?? ''))
    .slice(0, limit)
}

/** Unpaid dues within the next 7 days (inclusive of today). */
export function dueThisWeekItems(items: LineItem[], today: string): LineItem[] {
  const end = addDays(today, 6)
  return itemsWithDueDates(items)
    .filter(
      (i) =>
        i.status !== 'paid' &&
        remainingDue(i) > 0 &&
        dueDateKeys(i).some((d) => d >= today && d <= end),
    )
    .sort((a, b) => (earliestDueDate(a) ?? '').localeCompare(earliestDueDate(b) ?? ''))
}

/** Money owed with no due date set. */
export function undatedUnpaidItems(items: LineItem[]): LineItem[] {
  return items
    .filter(
      (i) => i.status !== 'paid' && dueDateKeys(i).length === 0 && !/^budget$/i.test(i.label.trim()),
    )
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Unpaid with remaining balance and any due date before today. */
export function isOverdue(item: LineItem, today: string): boolean {
  if (item.status === 'paid' || remainingDue(item) <= 0) return false
  return dueDateKeys(item).some((d) => d < today)
}

export type DayTone = 'empty' | 'paid' | 'due' | 'overdue'

/** Strongest urgency among items due on a day. */
export function dayTone(items: LineItem[], today: string, dateKey?: string): DayTone {
  if (!items.length) return 'empty'
  if (dateKey) {
    if (items.some((i) => i.status !== 'paid' && remainingDue(i) > 0 && dateKey < today)) {
      return 'overdue'
    }
    if (items.some((i) => i.status !== 'paid')) return 'due'
    return 'paid'
  }
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
    for (const date of dueDateKeys(item)) {
      if (!date.startsWith(prefix)) continue
      if (item.status === 'paid') paid += 1
      else if (date < today) overdue += 1
      else upcoming += 1
    }
  }
  return { overdue, upcoming, paid }
}
