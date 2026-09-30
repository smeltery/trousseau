import { useLiveQuery } from 'dexie-react-hooks'
import type { Category, Fund, LineItem } from '../../db/types'
import { db } from '../../db/dexie'
import { dbWrite } from '../../lib/db-write'
import { todayKey } from '../../lib/calendar'
import { formatMoney } from '../../lib/money'
import { buildWrapSummary } from '../../lib/ux/post-wedding-wrap'
import type { SiteSettings } from '../../lib/site-settings'
import { showToast } from '../../lib/toast'
import { dayOfCashTotal } from '../../lib/ux/who-pays-rollup'

export function PostWeddingWrap({
  site,
  funds,
  categories,
  lineItems,
  onOpenItem,
}: {
  site: SiteSettings
  funds: Fund[]
  categories: Category[]
  lineItems: LineItem[]
  onOpenItem: (id: string) => void
}) {
  const today = todayKey()
  const wrap = buildWrapSummary(site, funds, categories, lineItems, today)
  const liveFunds = useLiveQuery(() => db.funds.toArray(), []) ?? funds
  if (!wrap) return null

  const dayCash = dayOfCashTotal(site.dayOfCash?.tipCash, site.dayOfCash?.vendorCash)
  const giftHaul = wrap.dayOfGifts.reduce((s, f) => s + f.amount, 0)

  return (
    <section
      id="wrap"
      className="relative border-t border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] page-pad py-16"
    >
      <div className="page-shell">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          After the wedding
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] tracking-[-0.02em]">
          Wrap-up
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--ink-muted)]">
          Thank-yous, open refunds, and final spent versus what you allocated.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--ink-faint)] uppercase">
              Spent
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {formatMoney(wrap.spent)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--ink-faint)] uppercase">
              Allocated
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {formatMoney(wrap.allocated)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--ink-faint)] uppercase">
              Planned
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {formatMoney(wrap.planned)}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Unthanked gifts ({wrap.unthanked.length})
            </h3>
            {wrap.unthanked.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink-faint)]">All gifts thanked.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--line-soft)]">
                {wrap.unthanked.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      {f.label}
                      <span className="text-[var(--ink-faint)]"> · {formatMoney(f.amount)}</span>
                    </span>
                    <button
                      type="button"
                      className="font-semibold text-[var(--accent-deep)] hover:underline"
                      onClick={async () => {
                        await dbWrite(() => db.funds.update(f.id, { thanked: true }))
                        showToast('Marked thanked')
                      }}
                    >
                      Thanked
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Open refunds ({wrap.openRefunds.length})
            </h3>
            {wrap.openRefunds.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink-faint)]">No open reimbursements.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--line-soft)]">
                {wrap.openRefunds.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:underline"
                      onClick={() => onOpenItem(i.id)}
                    >
                      <span>{i.label}</span>
                      <span className="tabular-nums text-[var(--ink-muted)]">
                        {formatMoney(i.amount > 0 ? i.amount : i.paidAmount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {(wrap.dayOfGifts.length > 0 || dayCash > 0) && (
          <div className="mt-10 border-t border-[var(--line-soft)] pt-6">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Day-of gift haul
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              {wrap.dayOfGifts.length} gift{wrap.dayOfGifts.length === 1 ? '' : 's'} received around
              the wedding · {formatMoney(giftHaul)}
              {dayCash > 0 ? ` · ${formatMoney(dayCash)} day-of cash float` : ''}
            </p>
            {liveFunds !== funds ? null : null}
          </div>
        )}
      </div>
    </section>
  )
}
