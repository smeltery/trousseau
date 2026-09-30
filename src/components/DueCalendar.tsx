import { useMemo, useState } from 'react'
import type { Category, LineItem } from '../db/types'
import {
  addDays,
  addMonths,
  agendaItems,
  buildDueDatesIcs,
  groupByDueDate,
  itemsWithDueDates,
  monthCells,
  monthDueStats,
  monthLabel,
  startOfWeek,
  todayKey,
  weekDays,
  weekLabel,
  yearMonthTones,
} from '../lib/calendar'
import { downloadBlob } from '../lib/export-import'
import { formatDue, weddingCountdown } from '../lib/expense-display'
import { showToast } from '../lib/toast'
import { CalendarLegend, DueAgendaList } from './DueAgendaList'
import { MonthGrid } from './calendar/MonthGrid'
import { WeekGrid } from './calendar/WeekGrid'
import { YearGrid } from './calendar/YearGrid'
import type { CalendarView } from './calendar/tones'

interface DueCalendarProps {
  categories: Category[]
  lineItems: LineItem[]
  weddingDate?: string
  onOpenItem: (id: string) => void
}

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

export function DueCalendar({ categories, lineItems, weddingDate, onOpenItem }: DueCalendarProps) {
  const today = todayKey()
  const countdown = weddingCountdown(weddingDate, today)
  const [view, setView] = useState<CalendarView>('month')
  const [agendaLimit, setAgendaLimit] = useState(12)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selected, setSelected] = useState<string | null>(today)

  const byDate = useMemo(() => groupByDueDate(lineItems), [lineItems])
  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor])
  const week = useMemo(() => weekDays(weekStart), [weekStart])
  const yearMonths = useMemo(
    () => yearMonthTones(lineItems, cursor.year, today),
    [lineItems, cursor.year, today],
  )
  const agenda = useMemo(
    () => agendaItems(lineItems, today, agendaLimit),
    [lineItems, today, agendaLimit],
  )
  const agendaAll = useMemo(() => agendaItems(lineItems, today, 999), [lineItems, today])
  const stats = useMemo(() => {
    if (view === 'year') {
      return yearMonths.reduce(
        (acc, m) => ({
          overdue: acc.overdue + m.overdue,
          upcoming: acc.upcoming + m.upcoming,
          paid: acc.paid + m.paid,
        }),
        { overdue: 0, upcoming: 0, paid: 0 },
      )
    }
    return monthDueStats(lineItems, cursor.year, cursor.month, today)
  }, [view, yearMonths, lineItems, cursor, today])
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Expense'
  }, [categories])

  const selectedItems = selected ? (byDate.get(selected) ?? []) : []
  const datedCount = itemsWithDueDates(lineItems).length

  function goToday() {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setWeekStart(startOfWeek(today))
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

  function selectDay(key: string) {
    setSelected(key)
    const d = new Date(`${key}T12:00:00`)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setWeekStart(startOfWeek(key))
  }

  const navLabel =
    view === 'week'
      ? weekLabel(weekStart)
      : view === 'year'
        ? String(cursor.year)
        : monthLabel(cursor.year, cursor.month)

  function goPrev() {
    if (view === 'week') setWeekStart((w) => addDays(w, -7))
    else if (view === 'year') setCursor((c) => ({ year: c.year - 1, month: c.month }))
    else setCursor((c) => addMonths(c.year, c.month, -1))
  }

  function goNext() {
    if (view === 'week') setWeekStart((w) => addDays(w, 7))
    else if (view === 'year') setCursor((c) => ({ year: c.year + 1, month: c.month }))
    else setCursor((c) => addMonths(c.year, c.month, 1))
  }

  return (
    <section id="calendar" className="scroll-mt-24 overflow-x-clip bg-[var(--mist)] page-pad py-24">
      <div className="page-shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
              Calendar
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
              What&apos;s due
            </h2>
            <p className="mt-4 text-base leading-[26px] text-[var(--ink-muted)]">
              Week, month, or year. Color shows urgency.
              {weddingDate && countdown ? (
                <>
                  {' '}
                  <span className="font-semibold text-[var(--accent-deep)]">
                    {countdown}
                    {countdown !== 'Wedding day' ? ` · ${formatDue(weddingDate)}` : ''}.
                  </span>
                </>
              ) : (
                <> Set a wedding date in the hero for a countdown.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={exportIcs}
            className="btn-ghost shrink-0 self-start"
            title={datedCount === 0 ? 'Add due dates to expenses first' : 'Download .ics'}
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous"
                  className="btn-ghost px-3 py-2"
                  onClick={goPrev}
                >
                  ‹
                </button>
                <p className="min-w-[10rem] text-center font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
                  {navLabel}
                </p>
                <button type="button" aria-label="Next" className="btn-ghost px-3 py-2" onClick={goNext}>
                  ›
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="tablist"
                  aria-label="Calendar view"
                  className="inline-flex border border-[var(--line-soft)] bg-[var(--paper)]"
                  onKeyDown={(e) => {
                    const i = VIEWS.findIndex((v) => v.id === view)
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault()
                      const next =
                        e.key === 'ArrowRight'
                          ? VIEWS[(i + 1) % VIEWS.length]!
                          : VIEWS[(i - 1 + VIEWS.length) % VIEWS.length]!
                      setView(next.id)
                    }
                  }}
                >
                  {VIEWS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={view === v.id}
                      tabIndex={view === v.id ? 0 : -1}
                      onClick={() => setView(v.id)}
                      className={`px-3 py-2 text-sm font-semibold transition-colors ${
                        view === v.id
                          ? 'bg-[var(--grove)] text-[var(--on-dark)]'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="link-quiet text-sm !text-[var(--ink-muted)]"
                  onClick={goToday}
                >
                  Today
                </button>
              </div>
            </div>

            {view === 'week' ? (
              <WeekGrid
                days={week}
                byDate={byDate}
                today={today}
                selected={selected}
                onSelect={selectDay}
                onOpenItem={onOpenItem}
              />
            ) : null}
            {view === 'month' ? (
              <MonthGrid
                cells={cells}
                byDate={byDate}
                today={today}
                selected={selected}
                onSelect={selectDay}
                onOpenItem={onOpenItem}
              />
            ) : null}
            {view === 'year' ? (
              <YearGrid
                months={yearMonths}
                activeMonth={cursor.month}
                onOpenMonth={(month) => {
                  setCursor((c) => ({ ...c, month }))
                  setView('month')
                }}
              />
            ) : null}

            {datedCount === 0 ? (
              <p className="mt-4 text-sm text-[var(--ink-faint)]">
                No due dates yet. Open an expense and set a due date to fill the calendar — then export
                an .ics for Apple, Google, or Outlook.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-10">
            {view !== 'year' ? (
              <DueAgendaList
                title={selected ? formatDue(selected) : 'Pick a day'}
                empty="Nothing due this day."
                items={selectedItems}
                categoryName={categoryName}
                today={today}
                onOpenItem={onOpenItem}
              />
            ) : null}
            <div className="flex flex-col gap-3">
              <DueAgendaList
                title="Coming up"
                empty="No unpaid dues on the books."
                items={agenda}
                categoryName={categoryName}
                today={today}
                showDate
                onOpenItem={onOpenItem}
              />
              {agendaAll.length > agenda.length ? (
                <button
                  type="button"
                  className="link-quiet self-start text-sm"
                  onClick={() => setAgendaLimit(agendaAll.length)}
                >
                  Show all {agendaAll.length}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
