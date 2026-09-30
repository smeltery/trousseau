import { db, newId } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { todayKey } from '../../lib/calendar'
import { dbWrite } from '../../lib/db-write'
import { dateAfterWedding } from '../../lib/ux/wedding-dues'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { showToast } from '../../lib/toast'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineItemField } from './line-item-field'

export function LineItemReimburseSection({
  item,
  expectedBack,
  backReceived,
  onExpectedBack,
  onBackReceived,
}: {
  item: LineItem
  expectedBack: string
  backReceived: boolean
  onExpectedBack: (next: string) => void
  onBackReceived: (next: boolean) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const weddingDate = (parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE).weddingDate
  const offset =
    item.expectedBackOffsetDays != null ? String(item.expectedBackOffsetDays) : ''

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  return (
    <div className="grid gap-4 rounded-sm border border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_60%,transparent)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        Reimbursement
      </p>
      <LineItemField label="Expected back">
        <input
          type="date"
          value={expectedBack}
          onChange={(e) => {
            const next = e.target.value
            onExpectedBack(next)
            void persist({ expectedBackDate: next || undefined, expectedBackOffsetDays: undefined })
          }}
          className="field-input"
        />
      </LineItemField>
      {weddingDate ? (
        <LineItemField label="Days after wedding">
          <input
            inputMode="numeric"
            value={offset}
            onChange={(e) => {
              const raw = e.target.value.trim()
              if (!raw) {
                void persist({ expectedBackOffsetDays: undefined })
                return
              }
              const n = Number.parseInt(raw, 10)
              if (!Number.isFinite(n) || n < 0) return
              const nextDate = dateAfterWedding(weddingDate, n)
              onExpectedBack(nextDate)
              void persist({ expectedBackOffsetDays: n, expectedBackDate: nextDate })
            }}
            className="field-input"
            placeholder="e.g. 30"
          />
        </LineItemField>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={backReceived}
          onChange={(e) => {
            const next = e.target.checked
            onBackReceived(next)
            void persist({ backReceived: next || undefined })
          }}
        />
        <span>Received back</span>
      </label>
      {backReceived ? (
        <button
          type="button"
          className="btn-ghost self-start px-3 py-1.5 text-sm"
          onClick={async () => {
            const funds = await db.funds.where('type').equals('savings').toArray()
            const sort = funds.length === 0 ? 0 : Math.max(...funds.map((f) => f.sort), 0) + 1
            const amount = item.amount > 0 ? item.amount : item.paidAmount
            await dbWrite(() =>
              db.funds.add({
                id: newId('fund'),
                label: item.label,
                amount,
                type: 'savings',
                sort,
                receivedDate: todayKey(),
              }),
            )
            showToast('Added as savings fund')
          }}
        >
          Add as savings fund
        </button>
      ) : null}
    </div>
  )
}
