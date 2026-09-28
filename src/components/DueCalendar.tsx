import { useMemo, useState } from 'react'
import type { Category, LineItem } from '../db/types'
import {
  addMonths,
  agendaItems,
  buildDueDatesIcs,
  dayTone,
  groupByDueDate,
  isOverdue,
  itemsWithDueDates,
  monthCells,
  monthDueStats,
  monthLabel,
  todayKey,
  type DayTone,
} from '../lib/calendar'
import { downloadBlob } from '../lib/export-import'
import { formatDue } from '../lib/expense-display'
import { formatMoney } from '../lib/money'
import { showToast } from '../lib/toast'
import { CalendarLegend, DueAgendaList } from './DueAgendaList'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TONE_CELL: Record<DayTone, string> = {
  empty: 'bg-[var(--wash)]',
  paid: 'bg-[color-mix(in_srgb,var(--lichen)_16%,var(--wash))]',
  due: 'bg-[color-mix(in_srgb,var(--accent)_18%,var(--wash))]',
  overdue: 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--wash))]',
}

const TONE_CHIP: Record<'paid' | 'due' | 'overdue', string> = {
  paid: 'bg-[color-mix(in_srgb,var(--lichen)_22%,transparent)] text-[var(--grove)] hover:bg-[color-mix(in_srgb,var(--lichen)_38%,transparent)]',
  due: 'bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] text-[var(--grove)] hover:bg-[color-mix(in_srgb,var(--accent)_48%,transparent)]',
  overdue:
    'bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_34%,transparent)]',
}

interface DueCalendarProps {
  categories: Category[]
  lineItems: LineItem[]
  onOpenItem: (id: string) => void
}

export function DueCalendar({ categories, lineItems, onOpenItem }: DueCalendarProps) {
  const today = todayKey()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState<string | null>(today)

  const byDate = useMemo(() => groupByDueDate(lineItems), [lineItems])
  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor])
  const agenda = useMemo(() => agendaItems(lineItems, today), [lineItems, today])
  const stats = useMemo(
    () => monthDueStats(lineItems, cursor.year, cursor.month, today),
    [lineItems, cursor, today],
  )
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Expense'
  }, [categories])

  const selectedItems = selected ? (byDate.get(selected) ?? []) : []
  const datedCount = itemsWithDueDates(lineItems).length

  function goToday() {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(today)
  }

  function exportIcs() {
    if (datedCount === 0) {
      showToast('Add due dates to expenses first')
      return
    }
    downloadBlob(
      new Blob([buildDueDatesIcs(lineItems, categoryName)], { type: 'text/calendar;charset=utf-8' }),
      'trousseau-due-dates.ics',
    )
    showToast('Calendar file downloaded')
  }

  return (
    <section id="calendar" className="scroll-mt-24 bg-[var(--mist)] page-pad py-24">
      <div className="page-shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
              Calendar
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
              What&apos;s due
            </h2>
            <p className="mt-4 text-base leading-[26px] text-[var(--ink-muted)]">
              Color shows urgency at a glance. Open a day for details, or export an .ics for Apple,
              Google, or Outlook.
            </p>
          </div>
          <button
            type="button"
            onClick={exportIcs}
            disabled={datedCount === 0}
            className="btn-ghost self-start disabled:opacity-50 sm:self-end"
          >
            Export to calendar
          </button>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--ink-muted)]">
          <CalendarLegend swatch="bg-[var(--danger)]" label="Overdue" count={stats.overdue} />
          <CalendarLegend swatch="bg-[var(--accent)]" label="Upcoming" count={stats.upcoming} />
          <CalendarLegend swatch="bg-[var(--lichen)]" label="Paid" count={stats.paid} />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="btn-ghost px-3 py-2"
                  onClick={() => setCursor((c) => addMonths(c.year, c.month, -1))}
                >
                  ‹
                </button>
                <p className="min-w-[10rem] text-center font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
                  {monthLabel(cursor.year, cursor.month)}
                </p>
                <button
                  type="button"
                  aria-label="Next month"
                  className="btn-ghost px-3 py-2"
                  onClick={() => setCursor((c) => addMonths(c.year, c.month, 1))}
                >
                  ›
                </button>
              </div>
              <button type="button" className="link-quiet text-sm !text-[var(--ink-muted)]" onClick={goToday}>
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-sm border border-[var(--line-soft)] bg-[var(--line-soft)]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="bg-[var(--paper)] px-1 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase"
                >
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => {
                if (!cell.key || cell.day == null) {
                  return <div key={`pad-${i}`} className="min-h-[5.5rem] bg-[var(--paper)] sm:min-h-[6.5rem]" />
                }
                const dues = byDate.get(cell.key) ?? []
                const tone = dayTone(dues, today)
                const isToday = cell.key === today
                const isSelected = cell.key === selected
                const dateKey = cell.key
                return (
                  <div
                    key={dateKey}
                    role="gridcell"
                    aria-selected={isSelected}
                    onClick={() => setSelected(dateKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(dateKey)
                      }
                    }}
                    tabIndex={0}
                    className={`flex min-h-[5.5rem] cursor-pointer flex-col gap-1 p-1.5 text-left transition-[box-shadow,filter] hover:brightness-[0.97] sm:min-h-[6.5rem] sm:p-2 ${TONE_CELL[tone]} ${
                      isSelected ? 'ring-2 ring-inset ring-[var(--accent-deep)]' : ''
                    } ${isToday ? 'shadow-[inset_0_0_0_1px_var(--lichen)]' : ''}`}
                  >
                    <span
                      className={`text-sm tabular-nums ${
                        isToday
                          ? 'font-semibold text-[var(--lichen)]'
                          : tone === 'overdue'
                            ? 'font-semibold text-[var(--danger)]'
                            : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    <span className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                      {dues.slice(0, 2).map((item) => {
                        const chip = isOverdue(item, today)
                          ? 'overdue'
                          : item.status === 'paid'
                            ? 'paid'
                            : 'due'
                        const amount = item.amount > 0 ? formatMoney(item.amount) : ''
                        const status =
                          chip === 'overdue' ? 'Overdue' : chip === 'paid' ? 'Paid' : 'Due'
                        return (
                          <button
                            key={item.id}
                            type="button"
                            title={`${item.label}${amount ? ` · ${amount}` : ''} · ${status}. Open expense.`}
                            aria-label={`Open ${item.label}${amount ? `, ${amount}` : ''}, ${status}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(dateKey)
                              onOpenItem(item.id)
                            }}
                            className={`truncate rounded-[2px] px-1 py-0.5 text-left text-[10px] leading-3 font-medium tracking-[0.01em] shadow-none transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:shadow-[0_1px_4px_color-mix(in_srgb,var(--grove)_18%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-deep)] active:translate-y-0 sm:text-[11px] sm:leading-4 ${TONE_CHIP[chip]}`}
                          >
                            <span className="sm:hidden">{item.label}</span>
                            <span className="hidden sm:inline">
                              {item.label}
                              {amount ? ` · ${amount}` : ''}
                            </span>
                          </button>
                        )
                      })}
                      {dues.length > 2 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(dateKey)
                          }}
                          className="rounded-[2px] px-0.5 text-left text-[10px] font-semibold text-[var(--ink-faint)] transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-[var(--ink-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                        >
                          +{dues.length - 2} more
                        </button>
                      ) : null}
                    </span>
                  </div>
                )
              })}
            </div>
            {datedCount === 0 ? (
              <p className="mt-4 text-sm text-[var(--ink-faint)]">
                No due dates yet. Open an expense and set a due date to fill the calendar.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-10">
            <DueAgendaList
              title={selected ? formatDue(selected) : 'Pick a day'}
              empty="Nothing due this day."
              items={selectedItems}
              categoryName={categoryName}
              today={today}
              onOpenItem={onOpenItem}
            />
            <DueAgendaList
              title="Coming up"
              empty="No unpaid dues on the books."
              items={agenda}
              categoryName={categoryName}
              today={today}
              showDate
              onOpenItem={onOpenItem}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
