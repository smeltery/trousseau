import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { dateFromWeddingOffset } from '../../lib/ux/wedding-dues'
import { LineItemField } from './line-item-field'

export function LineItemDuesSection({
  item,
  dueDate,
  balanceDue,
  dueOffset,
  balanceOffset,
  onDueDate,
  onBalanceDue,
  onDueOffset,
  onBalanceOffset,
}: {
  item: LineItem
  dueDate: string
  balanceDue: string
  dueOffset: string
  balanceOffset: string
  onDueDate: (next: string) => void
  onBalanceDue: (next: string) => void
  onDueOffset: (next: string) => void
  onBalanceOffset: (next: string) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const weddingDate = (parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE).weddingDate

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <LineItemField label="Due date (deposit)">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const next = e.target.value
              onDueDate(next)
              void persist({ dueDate: next || undefined })
            }}
            className="field-input"
          />
        </LineItemField>
        <LineItemField label="Balance due">
          <input
            type="date"
            value={balanceDue}
            onChange={(e) => {
              const next = e.target.value
              onBalanceDue(next)
              void persist({ remainingBalanceDueDate: next || undefined })
            }}
            className="field-input"
          />
        </LineItemField>
      </div>
      {weddingDate ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <LineItemField label="Days before wedding (due)">
            <input
              inputMode="numeric"
              value={dueOffset}
              placeholder="e.g. 30"
              onChange={(e) => onDueOffset(e.target.value)}
              onBlur={() => {
                const raw = dueOffset.trim()
                if (!raw) {
                  void persist({ dueOffsetDays: undefined })
                  return
                }
                const n = Math.max(0, Math.round(Number(raw)))
                if (!Number.isFinite(n)) return
                onDueOffset(String(n))
                const nextDue = dateFromWeddingOffset(weddingDate, n)
                onDueDate(nextDue)
                void persist({ dueOffsetDays: n, dueDate: nextDue })
              }}
              className="field-input"
            />
          </LineItemField>
          <LineItemField label="Days before wedding (balance)">
            <input
              inputMode="numeric"
              value={balanceOffset}
              placeholder="e.g. 14"
              onChange={(e) => onBalanceOffset(e.target.value)}
              onBlur={() => {
                const raw = balanceOffset.trim()
                if (!raw) {
                  void persist({ balanceOffsetDays: undefined })
                  return
                }
                const n = Math.max(0, Math.round(Number(raw)))
                if (!Number.isFinite(n)) return
                onBalanceOffset(String(n))
                const next = dateFromWeddingOffset(weddingDate, n)
                onBalanceDue(next)
                void persist({ balanceOffsetDays: n, remainingBalanceDueDate: next })
              }}
              className="field-input"
            />
          </LineItemField>
        </div>
      ) : null}
    </div>
  )
}
