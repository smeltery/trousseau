import type { LineItem } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { db } from '../../db/dexie'
import { formatMoney } from '../../lib/money'
import { quoteDelta } from '../../lib/ux/who-pays-rollup'
import { showToast } from '../../lib/toast'

/** Lock original estimate, then show invoice delta as amount changes. */
export function LineItemQuoteSection({ item }: { item: LineItem }) {
  const delta = quoteDelta(item)

  return (
    <div className="grid gap-3 rounded-sm border border-[var(--line-soft)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        Quote → contract
      </p>
      {item.quotedAmount != null ? (
        <>
          <p className="text-sm text-[var(--ink-muted)]">
            Original quote {formatMoney(item.quotedAmount)}
            {delta != null && delta !== 0 ? (
              <>
                {' · '}
                <span className={delta > 0 ? 'text-[var(--danger)]' : 'text-[var(--lichen)]'}>
                  {delta > 0 ? '+' : ''}
                  {formatMoney(delta)} vs quote
                </span>
              </>
            ) : (
              <span className="text-[var(--ink-faint)]"> · matches invoice</span>
            )}
          </p>
          <button
            type="button"
            className="btn-ghost self-start px-3 py-1.5 text-sm"
            onClick={async () => {
              await dbWrite(() =>
                db.lineItems
                  .where('id')
                  .equals(item.id)
                  .modify((row) => {
                    delete row.quotedAmount
                  }),
              )
              showToast('Quote unlocked')
            }}
          >
            Clear quote lock
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--ink-faint)]">
            Lock today’s expected amount as the original estimate, then update the line when the
            contracted invoice differs.
          </p>
          <button
            type="button"
            className="btn-ghost self-start px-3 py-1.5 text-sm"
            onClick={async () => {
              if (!(item.amount > 0)) {
                showToast('Set an expected amount first')
                return
              }
              await dbWrite(() => db.lineItems.update(item.id, { quotedAmount: item.amount }))
              showToast('Quote locked')
            }}
          >
            Lock as quote
          </button>
        </>
      )}
    </div>
  )
}
