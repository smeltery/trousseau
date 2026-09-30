import type { YearMonthTone } from '../../lib/calendar'

export function YearGrid({
  months,
  activeMonth,
  onOpenMonth,
}: {
  months: YearMonthTone[]
  activeMonth: number
  onOpenMonth: (month: number) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {months.map((m) => {
        const isActive = m.month === activeMonth
        const heat =
          m.total === 0
            ? 'bg-[var(--wash)]'
            : m.overdue > 0
              ? 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--wash))]'
              : m.upcoming > 0
                ? 'bg-[color-mix(in_srgb,var(--accent)_16%,var(--wash))]'
                : 'bg-[color-mix(in_srgb,var(--lichen)_14%,var(--wash))]'
        return (
          <button
            key={m.month}
            type="button"
            onClick={() => onOpenMonth(m.month)}
            className={`rounded-sm border border-[var(--line-soft)] p-4 text-left transition-[box-shadow,filter] hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${heat} ${
              isActive ? 'ring-2 ring-[var(--accent-deep)]' : ''
            }`}
          >
            <p className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">{m.label}</p>
            {m.total === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-faint)]">No dues</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)]">
                {m.overdue > 0 ? (
                  <span>
                    <span className="font-semibold text-[var(--danger)]">{m.overdue}</span> overdue
                  </span>
                ) : null}
                {m.upcoming > 0 ? (
                  <span>
                    <span className="font-semibold text-[var(--accent-deep)]">{m.upcoming}</span> upcoming
                  </span>
                ) : null}
                {m.paid > 0 ? (
                  <span>
                    <span className="font-semibold text-[var(--lichen)]">{m.paid}</span> paid
                  </span>
                ) : null}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
