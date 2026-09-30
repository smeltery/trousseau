import type { WhoPays } from '../../db/types'
import type { SiteSettings } from '../../lib/site-settings'

export type ExpenseFilter =
  | 'all'
  | 'unpaid'
  | 'overdue'
  | 'dueSoon'
  | 'undated'
  | 'reimburse'
  | 'noReceipt'
export type WhoPaysFilter = 'all' | 'unset' | WhoPays

const FILTERS: { id: ExpenseFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'dueSoon', label: 'Due soon' },
  { id: 'undated', label: 'No due date' },
  { id: 'reimburse', label: 'Reimburse aging' },
  { id: 'noReceipt', label: 'Paid, no receipt' },
]

export function ExpenseFilterBar({
  site,
  filter,
  whoFilter,
  query,
  hidePaid,
  showArchived,
  onFilter,
  onWhoFilter,
  onQuery,
  onHidePaid,
  onShowArchived,
}: {
  site: SiteSettings
  filter: ExpenseFilter
  whoFilter: WhoPaysFilter
  query: string
  hidePaid: boolean
  showArchived: boolean
  onFilter: (next: ExpenseFilter) => void
  onWhoFilter: (next: WhoPaysFilter) => void
  onQuery: (next: string) => void
  onHidePaid: (next: boolean) => void
  onShowArchived: (next: boolean) => void
}) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Expense filter"
          className="inline-flex flex-wrap border border-[var(--line-soft)] bg-[var(--paper)]"
          onKeyDown={(e) => {
            const i = FILTERS.findIndex((f) => f.id === filter)
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault()
              const next =
                e.key === 'ArrowRight'
                  ? FILTERS[(i + 1) % FILTERS.length]!
                  : FILTERS[(i - 1 + FILTERS.length) % FILTERS.length]!
              onFilter(next.id)
            }
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              tabIndex={filter === f.id ? 0 : -1}
              onClick={() => onFilter(f.id)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-[var(--grove)] text-[var(--on-dark)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative block min-w-0 sm:w-64">
          <span className="sr-only">Search expenses</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search vendor, notes…"
            className="field-input w-full py-2 text-sm"
          />
        </label>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
            Who pays
          </span>
          <select
            value={whoFilter}
            onChange={(e) => onWhoFilter(e.target.value as WhoPaysFilter)}
            className="field-input py-1.5 text-sm"
            aria-label="Filter by who pays"
          >
            <option value="all">Anyone</option>
            <option value="unset">Unset</option>
            <option value="joint">Joint</option>
            <option value="left">{site.brandLeft}</option>
            <option value="right">{site.brandRight}</option>
          </select>
        </label>
        {filter === 'all' ? (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)]">
            <input
              type="checkbox"
              checked={hidePaid}
              onChange={(e) => onHidePaid(e.target.checked)}
            />
            Hide paid
          </label>
        ) : null}
        <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>
    </>
  )
}
