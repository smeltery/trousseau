import { useMemo, useState } from 'react'
import type { Category, LineItem } from '../db/types'
import {
  addMonths,
  agendaItems,
  buildDueDatesIcs,
  groupByDueDate,
  isOverdue,
  itemsWithDueDates,
  monthCells,
  monthLabel,
  todayKey,
} from '../lib/calendar'
import { downloadBlob } from '../lib/export-import'
import { formatDue } from '../lib/expense-display'
import { formatMoney } from '../lib/money'
import { showToast } from '../lib/toast'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    const ics = buildDueDatesIcs(lineItems, categoryName)
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'trousseau-due-dates.ics')
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
              Expenses with a due date land here so you can see payments coming up at a glance. Export
              an .ics file to open them in Apple, Google, or Outlook.
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

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
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
              <button type="button" className="link-quiet text-sm" onClick={goToday}>
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px border border-[var(--line-soft)] bg-[var(--line-soft)]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="bg-[var(--wash)] px-1 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase"
                >
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => {
                if (!cell.key || cell.day == null) {
                  return (
                    <div
                      key={`pad-${i}`}
                      className="min-h-[4.5rem] bg-[color-mix(in_srgb,var(--paper)_70%,var(--mist))]"
                    />
                  )
                }
                const dues = byDate.get(cell.key) ?? []
                const hasDue = dues.length > 0
                const hasOverdue = dues.some((item) => isOverdue(item, today))
                const isToday = cell.key === today
                const isSelected = cell.key === selected
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelected(cell.key)}
                    className={`flex min-h-[4.5rem] flex-col items-start gap-1 bg-[var(--wash)] p-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--wash))] ${
                      isSelected ? 'ring-2 ring-inset ring-[var(--accent)]' : ''
                    } ${isToday ? 'bg-[color-mix(in_srgb,var(--lichen)_12%,var(--wash))]' : ''}`}
                  >
                    <span
                      className={`text-sm tabular-nums ${isToday ? 'font-semibold text-[var(--lichen)]' : 'text-[var(--ink-muted)]'}`}
                    >
                      {cell.day}
                    </span>
                    {hasDue ? (
                      <span className="flex flex-wrap gap-1">
                        {dues.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            title={item.label}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOverdue(item, today)
                                ? 'bg-[var(--danger)]'
                                : item.status === 'paid'
                                  ? 'bg-[var(--lichen)]'
                                  : 'bg-[var(--accent)]'
                            }`}
                          />
                        ))}
                        {dues.length > 3 ? (
                          <span className="text-[10px] text-[var(--ink-faint)]">+{dues.length - 3}</span>
                        ) : null}
                      </span>
                    ) : null}
                    {hasOverdue ? <span className="sr-only">Has overdue items</span> : null}
                  </button>
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
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
                {selected ? formatDue(selected) : 'Pick a day'}
              </p>
              {selectedItems.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--ink-muted)]">Nothing due this day.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
                  {selectedItems.map((item) => (
                    <DueRow
                      key={item.id}
                      item={item}
                      category={categoryName(item.categoryId)}
                      today={today}
                      onOpen={() => onOpenItem(item.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
                Coming up
              </p>
              {agenda.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--ink-muted)]">No unpaid dues on the books.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
                  {agenda.map((item) => (
                    <DueRow
                      key={item.id}
                      item={item}
                      category={categoryName(item.categoryId)}
                      today={today}
                      showDate
                      onOpen={() => onOpenItem(item.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DueRow({
  item,
  category,
  today,
  showDate,
  onOpen,
}: {
  item: LineItem
  category: string
  today: string
  showDate?: boolean
  onOpen: () => void
}) {
  const overdue = isOverdue(item, today)
  const amount =
    item.amount > 0 ? formatMoney(item.amount) : item.paidAmount > 0 ? formatMoney(item.paidAmount) : '—'
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start justify-between gap-4 py-3 text-left transition-colors hover:text-[var(--accent-deep)]"
      >
        <span className="min-w-0">
          <span className="block text-base leading-5">{item.label}</span>
          <span className="mt-0.5 block text-sm text-[var(--ink-faint)]">
            {category}
            {showDate && item.dueDate ? ` · ${formatDue(item.dueDate)}` : ''}
            {overdue ? ' · overdue' : item.status === 'paid' ? ' · paid' : ''}
          </span>
        </span>
        <span
          className={`shrink-0 font-[family-name:var(--font-display)] text-xl tabular-nums ${overdue ? 'text-[var(--danger)]' : ''}`}
        >
          {amount}
        </span>
      </button>
    </li>
  )
}
