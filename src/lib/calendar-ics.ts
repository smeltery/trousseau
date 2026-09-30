import type { LineItem } from '../db/types'
import { addDays, earliestDueDate, itemsWithDueDates } from './calendar'

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsStamp(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsAllDayEvent(opts: {
  uid: string
  stamp: string
  date: string
  summary: string
  description?: string
  status?: string
  alarm?: boolean
}): string {
  const start = opts.date.replace(/-/g, '')
  const end = addDays(opts.date, 1).replace(/-/g, '')
  const summary = icsEscape(opts.summary)
  const lines = [
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${opts.stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${summary}`,
  ]
  if (opts.description) lines.push(`DESCRIPTION:${icsEscape(opts.description)}`)
  if (opts.status) lines.push(`STATUS:${opts.status}`)
  if (opts.alarm) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${summary}`,
      'TRIGGER:-P1D',
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

/** Build an .ics of expense dues (+ optional all-day wedding). */
export function buildDueDatesIcs(
  items: LineItem[],
  categoryName: (categoryId: string) => string,
  opts?: { weddingDate?: string; coupleNames?: string },
): string {
  const stamp = icsStamp()
  const events: string[] = []

  if (opts?.weddingDate) {
    events.push(
      icsAllDayEvent({
        uid: 'wedding@trousseau.app',
        stamp,
        date: opts.weddingDate,
        summary: opts.coupleNames?.trim() || 'Wedding',
        status: 'CONFIRMED',
      }),
    )
  }

  const dated = itemsWithDueDates(items).sort((a, b) =>
    (earliestDueDate(a) ?? '').localeCompare(earliestDueDate(b) ?? ''),
  )
  for (const item of dated) {
    const cat = categoryName(item.categoryId)
    const desc = [`Amount: ${item.amount}`, `Paid: ${item.paidAmount}`, `Status: ${item.status}`, item.notes?.trim()]
      .filter(Boolean)
      .join('\n')
    const paid = item.status === 'paid'
    if (item.dueDate) {
      events.push(
        icsAllDayEvent({
          uid: `${item.id}@trousseau.app`,
          stamp,
          date: item.dueDate,
          summary: `${cat}: ${item.label}`,
          description: desc,
          status: paid ? 'CONFIRMED' : 'TENTATIVE',
          alarm: !paid,
        }),
      )
    }
    if (item.remainingBalanceDueDate) {
      events.push(
        icsAllDayEvent({
          uid: `${item.id}-balance@trousseau.app`,
          stamp,
          date: item.remainingBalanceDueDate,
          summary: `${cat}: ${item.label} (balance)`,
          description: desc,
          status: paid ? 'CONFIRMED' : 'TENTATIVE',
          alarm: !paid,
        }),
      )
    }
  }

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
