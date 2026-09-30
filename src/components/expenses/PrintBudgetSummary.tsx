import type { Category, Fund, LineItem } from '../../db/types'
import { GROUP_ORDER, groupCategories } from '../../lib/budget'
import { categoryDisplayTotals, expensesPaidTotal, expensesRunningTotal } from '../../lib/expense-display'
import { formatMoney, sum } from '../../lib/money'
import type { SiteSettings } from '../../lib/site-settings'

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
