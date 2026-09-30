import { useMemo, useState } from 'react'
import type { Category, LineItem } from '../../db/types'
import {
  overdueAgendaItems,
  todayKey,
  undatedUnpaidItems,
  upcomingAgendaItems,
} from '../../lib/calendar'
import { formatDue } from '../../lib/expense-display'
import { CalendarLegend, DueAgendaList } from '../DueAgendaList'

export function CalendarAgenda({
  categories,
  lineItems,
  selected,
  selectedItems,
  showDayList,
  onOpenItem,
}: {
  categories: Category[]
  lineItems: LineItem[]
  selected: string | null
  selectedItems: LineItem[]
  showDayList: boolean
  onOpenItem: (id: string) => void
}) {
  const today = todayKey()
  const [upcomingLimit, setUpcomingLimit] = useState(12)
  const overdue = useMemo(() => overdueAgendaItems(lineItems, today), [lineItems, today])
  const upcomingAll = useMemo(() => upcomingAgendaItems(lineItems, today, 999), [lineItems, today])
  const upcoming = upcomingAll.slice(0, upcomingLimit)
  const undated = useMemo(() => undatedUnpaidItems(lineItems), [lineItems])
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? 'Expense'
  }, [categories])

  return (
    <div className="flex flex-col gap-10">
      {showDayList ? (
        <DueAgendaList
          title={selected ? formatDue(selected) : 'Pick a day'}
          empty="Nothing due this day."
          items={selectedItems}
          categoryName={categoryName}
          today={today}
          onOpenItem={onOpenItem}
        />
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
    <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--ink-muted)]">
      <CalendarLegend swatch="bg-[var(--danger)]" label="Overdue" count={overdue} />
      <CalendarLegend swatch="bg-[var(--accent)]" label="Upcoming" count={upcoming} />
      <CalendarLegend swatch="bg-[var(--lichen)]" label="Paid" count={paid} />
    </div>
  )
}
