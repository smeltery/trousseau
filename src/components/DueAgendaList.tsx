import type { LineItem } from '../db/types'
import { formatDue, formatLineAmount, paperLineStatus } from '../lib/expense-display'
import { canMarkPaid } from '../lib/expense-display'
import { markPaidWithUndo } from '../lib/ux/mark-paid'

export function CalendarLegend({
  swatch,
  label,
  count,
}: {
  swatch: string
  label: string
  count: number
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${swatch}`} />
      <span>
        {label}
        <span className="tabular-nums text-[var(--ink-faint)]"> · {count}</span>
      </span>
    </span>
  )
}

export function DueAgendaList({
  title,
  empty,
  items,
  categoryName,
  today,
  showDate,
  onOpenItem,
}: {
  title: string
  empty: string
  items: LineItem[]
  categoryName: (id: string) => string
  today: string
  showDate?: boolean
  onOpenItem: (id: string) => void
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
          {items.map((item) => {
            const { label: badge, tone: badgeTone, chip } = paperLineStatus(item, today)
            const amount = formatLineAmount(item)
            const bar =
              chip === 'overdue'
                ? 'bg-[var(--danger)]'
                : chip === 'paid'
                  ? 'bg-[var(--lichen)]'
                  : 'bg-[var(--accent)]'
            return (
              <li key={item.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  className="group flex min-w-0 flex-1 gap-3 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                >
                  <span aria-hidden className={`mt-1 w-1 shrink-0 self-stretch rounded-full ${bar}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-base leading-5 group-hover:text-[var(--accent-deep)]">
                        {item.label}
                      </span>
                      <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${badgeTone}`}>
                        {badge}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-[var(--ink-faint)]">
                      {categoryName(item.categoryId)}
                      {showDate && item.dueDate ? ` · ${formatDue(item.dueDate)}` : ''}
                      {showDate && !item.dueDate ? ' · No due date' : ''}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 self-center font-[family-name:var(--font-display)] text-xl tabular-nums ${chip === 'overdue' ? 'text-[var(--danger)]' : ''}`}
                  >
                    {amount}
                  </span>
                </button>
                {canMarkPaid(item) ? (
                  <button
                    type="button"
                    aria-label={`Mark ${item.label} paid`}
                    className="shrink-0 self-center px-2 text-xs font-semibold text-[var(--accent-deep)] hover:underline"
                    onClick={() => void markPaidWithUndo(item)}
                  >
                    Paid
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
