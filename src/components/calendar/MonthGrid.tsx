import type { LineItem } from '../../db/types'
import { dayTone, type MonthCell } from '../../lib/calendar'
import { dayDropProps } from './day-drop'
import { DueChip } from './shared'
import { TONE_CELL, WEEKDAYS } from './tones'

export function MonthGrid({
  cells,
  byDate,
  today,
  selected,
  weddingDate,
  onSelect,
  onOpenItem,
}: {
  cells: MonthCell[]
  byDate: Map<string, LineItem[]>
  today: string
  selected: string | null
  weddingDate?: string
  onSelect: (key: string) => void
  onOpenItem: (id: string) => void
}) {
  const dayKeys = cells.map((c) => c.key).filter((k): k is string => Boolean(k))
  const focusKey =
    selected && dayKeys.includes(selected)
      ? selected
      : (dayKeys.find((k) => k === today) ?? dayKeys[0] ?? null)

  return (
    <div
      role="grid"
      aria-label="Month"
      className="grid grid-cols-7 gap-px overflow-hidden rounded-sm border border-[var(--line-soft)] bg-[var(--line-soft)]"
    >
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          role="columnheader"
          className="bg-[var(--paper)] px-1 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase"
        >
          {d}
        </div>
      ))}
      {cells.map((cell, i) => {
        if (!cell.key || cell.day == null) {
          return (
            <div
              key={`pad-${i}`}
              role="gridcell"
              aria-hidden
              className="min-h-[5.5rem] bg-[var(--paper)] sm:min-h-[6.5rem]"
            />
          )
        }
        const dues = byDate.get(cell.key) ?? []
        const tone = dayTone(dues, today, cell.key)
        const isToday = cell.key === today
        const isWedding = Boolean(weddingDate && cell.key === weddingDate)
        const isSelected = cell.key === selected
        const dateKey = cell.key
        const dayIndex = dayKeys.indexOf(dateKey)
        const drop = dayDropProps(dateKey, () => onSelect(dateKey))
        return (
          <div
            key={dateKey}
            role="gridcell"
            aria-selected={isSelected}
            aria-label={isWedding ? `Wedding day ${dateKey}` : undefined}
            onClick={() => onSelect(dateKey)}
            onDragOver={drop.onDragOver}
            onDrop={drop.onDrop}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(dateKey)
              }
              if (e.key === 'ArrowLeft' && dayIndex > 0) {
                e.preventDefault()
                onSelect(dayKeys[dayIndex - 1]!)
              }
              if (e.key === 'ArrowRight' && dayIndex < dayKeys.length - 1) {
                e.preventDefault()
                onSelect(dayKeys[dayIndex + 1]!)
              }
              if (e.key === 'ArrowUp' && dayIndex >= 7) {
                e.preventDefault()
                onSelect(dayKeys[dayIndex - 7]!)
              }
              if (e.key === 'ArrowDown' && dayIndex + 7 < dayKeys.length) {
                e.preventDefault()
                onSelect(dayKeys[dayIndex + 7]!)
              }
            }}
            tabIndex={dateKey === focusKey ? 0 : -1}
            className={`flex min-h-[5.5rem] cursor-pointer flex-col gap-1 p-1.5 text-left transition-[box-shadow,filter] hover:brightness-[0.97] sm:min-h-[6.5rem] sm:p-2 ${TONE_CELL[tone]} ${
              isSelected ? 'ring-2 ring-inset ring-[var(--accent-deep)]' : ''
            } ${isToday ? 'shadow-[inset_0_0_0_1px_var(--lichen)]' : ''} ${
              isWedding && !isSelected ? 'ring-1 ring-inset ring-[var(--accent-deep)]' : ''
            }`}
          >
            <span className="flex items-center gap-1">
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
              {isWedding ? (
                <span
                  aria-hidden
                  className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[8px] font-bold tracking-tight text-[var(--accent-deep)] ring-1 ring-[var(--accent-deep)]"
                >
                  W
                </span>
              ) : null}
            </span>
            <span className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
              {dues.slice(0, 2).map((item) => (
                <DueChip
                  key={item.id}
                  item={item}
                  today={today}
                  onOpen={() => {
                    onSelect(dateKey)
                    onOpenItem(item.id)
                  }}
                />
              ))}
              {dues.length > 2 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(dateKey)
                  }}
                  className="min-h-6 rounded-[2px] px-0.5 text-left text-[10px] font-semibold text-[var(--ink-faint)] transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-[var(--ink-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                >
                  +{dues.length - 2} more
                </button>
              ) : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}
