import type { Category, Fund, LineItem } from '../../db/types'
import { GROUP_ORDER, groupCategories } from '../../lib/budget'
import {
  earliestDueDate,
  overdueAgendaItems,
  remainingDue,
  todayKey,
  upcomingAgendaItems,
} from '../../lib/calendar'
import { categoryDisplayTotals, expensesPaidTotal, expensesRunningTotal, formatDue } from '../../lib/expense-display'
import { formatMoney, sum } from '../../lib/money'
import type { SiteSettings } from '../../lib/site-settings'
import { giftPromiseRollup, whoPaysDisplayLines } from '../../lib/ux/who-pays-rollup'

export function PrintBudgetSummary({
  site,
  funds,
  categories,
  lineItems,
}: {
  site: SiteSettings
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
}) {
  const allocated = sum(funds.map((f) => f.amount))
  const budgeted = expensesRunningTotal(categories, lineItems)
  const paid = expensesPaidTotal(lineItems)
  const left = allocated - budgeted
  const gifts = funds.filter((f) => f.type === 'gift')
  const savings = funds.filter((f) => f.type === 'savings')
  const today = todayKey()
  const overdue = overdueAgendaItems(lineItems, today)
  const upcoming = upcomingAgendaItems(lineItems, today, 24)
  const pays = whoPaysDisplayLines(lineItems, site)
  const promise = giftPromiseRollup(funds)

  return (
    <section id="print-summary" className="print-only page-pad py-8" aria-hidden>
      <div className="page-shell">
        <header className="border-b border-[var(--line)] pb-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
            Trousseau
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {site.brandLeft} &amp; {site.brandRight}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Budget summary
            {site.weddingDate ? ` · ${site.weddingDate}` : ''}
          </p>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <Stat label="Funds" value={formatMoney(allocated)} />
          <Stat label="Allocated" value={formatMoney(budgeted)} />
          <Stat label={left < 0 ? 'Over' : 'Left'} value={formatMoney(Math.abs(left))} />
        </div>
        <p className="mt-2 text-sm text-[var(--ink-faint)]">{formatMoney(paid)} paid so far</p>
        {pays.length > 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Who pays ·{' '}
            {pays.map((r, i) => (
              <span key={r.label}>
                {i > 0 ? ' · ' : ''}
                {r.label} {formatMoney(r.amount)}
              </span>
            ))}
          </p>
        ) : null}
        {promise.promisedCount > 0 || promise.receivedCount > 0 ? (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Gifts · promised {formatMoney(promise.promised)} · received {formatMoney(promise.received)}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
              Gifts &amp; savings
            </h2>
            <FundTable title="Gifts" rows={gifts} />
            <FundTable title="Savings" rows={savings} />
            {gifts.length === 0 && savings.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-muted)]">No funds yet.</p>
            ) : null}
          </div>
          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
              Vendors &amp; venue
            </h2>
            {GROUP_ORDER.filter((g) => g !== 'reimbursement').map((group) => {
              const cats = groupCategories(categories, group)
              if (!cats.length) return null
              return (
                <div key={group} className="mt-4">
                  <p className="text-sm font-semibold">{site.groupLabels[group]}</p>
                  <ul className="mt-2 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
                    {cats.map((cat) => {
                      const items = lineItems.filter((i) => i.categoryId === cat.id)
                      const totals = categoryDisplayTotals(items)
                      return (
                        <li key={cat.id} className="flex justify-between gap-3 py-1.5 text-sm">
                          <span className="min-w-0 truncate">{cat.name}</span>
                          <span className="shrink-0 tabular-nums">
                            {formatMoney(totals.paid)} / {formatMoney(totals.amount)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {overdue.length > 0 || upcoming.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
              Upcoming dues
            </h2>
            <DueTable title="Overdue" rows={overdue} />
            <DueTable title="Upcoming" rows={upcoming} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-faint)] uppercase">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums">{value}</p>
    </div>
  )
}

function FundTable({ title, rows }: { title: string; rows: Fund[] }) {
  if (!rows.length) return null
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
        {rows.map((f) => (
          <li key={f.id} className="flex justify-between gap-3 py-1.5 text-sm">
            <span className="min-w-0 truncate">{f.label}</span>
            <span className="shrink-0 tabular-nums">{formatMoney(f.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DueTable({ title, rows }: { title: string; rows: LineItem[] }) {
  if (!rows.length) return null
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
        {rows.map((item) => {
          const due = earliestDueDate(item)
          return (
            <li key={item.id} className="flex justify-between gap-3 py-1.5 text-sm">
              <span className="min-w-0 truncate">
                {due ? formatDue(due) : '—'} · {item.label}
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(remainingDue(item))}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
