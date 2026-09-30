import { useMemo, useState } from 'react'
import type { Category, LineItem } from '../../db/types'
import { db } from '../../db/dexie'
import {
  dueThisWeekItems,
  overdueAgendaItems,
  todayKey,
  undatedUnpaidItems,
  upcomingAgendaItems,
} from '../../lib/calendar'
import { dbWrite } from '../../lib/db-write'
import { formatDue } from '../../lib/expense-display'
import { showToast } from '../../lib/toast'
import { CalendarLegend, DueAgendaList } from '../DueAgendaList'

export function CalendarAgenda({
  categories,
  lineItems,
  selected,
  selectedItems,
  showDayList,
  onOpenItem,
  onAddExpense,
}: {
  categories: Category[]
  lineItems: LineItem[]
  selected: string | null
  selectedItems: LineItem[]
  showDayList: boolean
  onOpenItem: (id: string) => void
  onAddExpense?: (dueDate?: string) => void
}) {
  const today = todayKey()
  const [upcomingLimit, setUpcomingLimit] = useState(12)
  const [assignId, setAssignId] = useState('')
  const overdue = useMemo(() => overdueAgendaItems(lineItems, today), [lineItems, today])
  const upcomingAll = useMemo(() => upcomingAgendaItems(lineItems, today, 999), [lineItems, today])
  const upcoming = upcomingAll.slice(0, upcomingLimit)
  const undated = useMemo(() => undatedUnpaidItems(lineItems), [lineItems])
  const dueWeek = useMemo(() => dueThisWeekItems(lineItems, today), [lineItems, today])
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Expense'
  }, [categories])

  return (
    <div className="flex flex-col gap-10">
      {dueWeek.length > 0 ? (
        <p className="rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--accent-deep)]">Due this week · </span>
          {dueWeek.length} unpaid
          {dueWeek[0] ? ` · next: ${dueWeek[0].label}` : ''}
        </p>
      ) : null}
      {showDayList ? (
        <div>
          <DueAgendaList
            title={selected ? formatDue(selected) : 'Pick a day'}
            empty="Nothing due this day."
            items={selectedItems}
            categoryName={categoryName}
            today={today}
            onOpenItem={onOpenItem}
          />
          {selected ? (
            <div className="mt-3 flex flex-col gap-2">
              {onAddExpense ? (
                <button
                  type="button"
                  className="link-quiet self-start text-sm"
                  onClick={() => onAddExpense(selected)}
                >
                  Add expense due this day
                </button>
              ) : null}
              {undated.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                    <span className="shrink-0 text-[var(--ink-faint)]">Assign undated</span>
                    <select
                      value={assignId}
                      onChange={(e) => setAssignId(e.target.value)}
                      className="field-input min-w-0 flex-1 py-1.5 text-sm"
                    >
                      <option value="">Choose…</option>
                      {undated.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-sm"
                    disabled={!assignId}
                    onClick={async () => {
                      if (!assignId || !selected) return
                      await dbWrite(() => db.lineItems.update(assignId, { dueDate: selected }))
                      showToast('Due date set')
                      setAssignId('')
                    }}
                  >
                    Assign
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {overdue.length > 0 ? (
        <DueAgendaList
          title="Overdue"
          empty="Nothing overdue."
          items={overdue}
          categoryName={categoryName}
          today={today}
          showDate
          onOpenItem={onOpenItem}
        />
      ) : null}
      <div className="flex flex-col gap-3">
        <DueAgendaList
          title="Coming up"
          empty="No upcoming dues."
          items={upcoming}
          categoryName={categoryName}
          today={today}
          showDate
          onOpenItem={onOpenItem}
        />
        {upcomingAll.length > upcoming.length ? (
          <button
            type="button"
            className="link-quiet self-start text-sm"
            onClick={() => setUpcomingLimit(upcomingAll.length)}
          >
            Show all {upcomingAll.length}
          </button>
        ) : null}
      </div>
      {undated.length > 0 ? (
        <DueAgendaList
          title="No due date"
          empty="Every unpaid expense has a due date."
          items={undated}
          categoryName={categoryName}
          today={today}
          showDate
          onOpenItem={onOpenItem}
        />
      ) : null}
      {overdue.length === 0 && upcomingAll.length === 0 && undated.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">No unpaid dues on the books.</p>
      ) : null}
    </div>
  )
}

export function CalendarStatsLegend({
  overdue,
  upcoming,
  paid,
}: {
  overdue: number
  upcoming: number
  paid: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--ink-muted)]">
      <CalendarLegend swatch="bg-[var(--danger)]" label="Overdue" count={overdue} />
      <CalendarLegend swatch="bg-[var(--accent)]" label="Upcoming" count={upcoming} />
      <CalendarLegend swatch="bg-[var(--lichen)]" label="Paid" count={paid} />
    </div>
  )
}
