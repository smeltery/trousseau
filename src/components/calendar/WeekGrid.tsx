import type { LineItem } from '../../db/types'
import { dayTone, parseDateKey } from '../../lib/calendar'
import { dayDropProps } from './day-drop'
import { DueChip } from './shared'
import { TONE_CELL, WEEKDAYS } from './tones'

export function WeekGrid({
  days,
  byDate,
  today,
  selected,
  weddingDate,
  onSelect,
  onOpenItem,
}: {
  days: string[]
  byDate: Map<string, LineItem[]>
  today: string
  selected: string | null
  weddingDate?: string
  onSelect: (key: string) => void
  onOpenItem: (id: string) => void
}) {
  const focusKey = selected && days.includes(selected) ? selected : (days.find((d) => d === today) ?? days[0])

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
      <div
        role="grid"
        aria-label="Week"
        className="grid min-w-[36rem] grid-cols-7 gap-px overflow-hidden rounded-sm border border-[var(--line-soft)] bg-[var(--line-soft)] sm:min-w-0"
      >
        {days.map((key, i) => {
          const dues = byDate.get(key) ?? []
          const tone = dayTone(dues, today, key)
          const isToday = key === today
          const isWedding = Boolean(weddingDate && key === weddingDate)
          const isSelected = key === selected
          const d = parseDateKey(key)
          const drop = dayDropProps(key, () => onSelect(key))
          return (
            <div
              key={key}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={isWedding ? `Wedding day ${key}` : undefined}
              onClick={() => onSelect(key)}
              onDragOver={drop.onDragOver}
              onDrop={drop.onDrop}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(key)
                }
                if (e.key === 'ArrowLeft' && i > 0) {
                  e.preventDefault()
                  onSelect(days[i - 1]!)
                }
                if (e.key === 'ArrowRight' && i < days.length - 1) {
                  e.preventDefault()
                  onSelect(days[i + 1]!)
                }
              }}
              tabIndex={key === focusKey ? 0 : -1}
              className={`flex min-h-[9rem] cursor-pointer flex-col gap-1.5 p-2 text-left transition-[box-shadow,filter] hover:brightness-[0.97] sm:min-h-[14rem] sm:p-2.5 ${TONE_CELL[tone]} ${
                isSelected ? 'ring-2 ring-inset ring-[var(--accent-deep)]' : ''
              } ${isToday ? 'shadow-[inset_0_0_0_1px_var(--lichen)]' : ''} ${
                isWedding && !isSelected ? 'ring-1 ring-inset ring-[var(--accent-deep)]' : ''
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase">
                  {WEEKDAYS[i]}
                  {isWedding ? (
                    <span
                      aria-hidden
                      className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[8px] font-bold normal-case tracking-tight text-[var(--accent-deep)] ring-1 ring-[var(--accent-deep)]"
                    >
                      W
                    </span>
                  ) : null}
                </span>
                <span
                  className={`text-sm tabular-nums ${
                    isToday
                      ? 'font-semibold text-[var(--lichen)]'
                      : tone === 'overdue'
                        ? 'font-semibold text-[var(--danger)]'
                        : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              <span className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {dues.length === 0 ? (
                  <span className="text-[11px] text-[var(--ink-faint)]">Drop here or add</span>
                ) : (
                  dues.map((item) => (
                    <DueChip
                      key={item.id}
                      item={item}
                      today={today}
                      onOpen={() => {
                        onSelect(key)
                        onOpenItem(item.id)
                      }}
                    />
                  ))
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
