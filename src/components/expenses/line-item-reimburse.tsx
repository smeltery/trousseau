import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Fund, LineItem } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { dateAfterWedding } from '../../lib/ux/wedding-dues'
import { creditRefundToFund } from '../../lib/ux/fund-drawdown'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { showToast } from '../../lib/toast'
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
  const funds = useLiveQuery(() => db.funds.orderBy('sort').toArray(), []) ?? ([] as Fund[])
  const weddingDate = (parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE).weddingDate
  const offset =
    item.expectedBackOffsetDays != null ? String(item.expectedBackOffsetDays) : ''
  const [creditFundId, setCreditFundId] = useState('')
  const refundAmount = item.amount > 0 ? item.amount : item.paidAmount

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  async function creditFund() {
    try {
      const msg = await creditRefundToFund({
        item,
        amount: refundAmount,
        fundId: creditFundId as '__new_savings__' | '__new_gift__' | string,
        funds,
      })
      onBackReceived(true)
      showToast(msg)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not credit')
    }
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
        <div className="grid gap-2">
          <LineItemField label="Credit to fund">
            <select
              value={creditFundId}
              onChange={(e) => setCreditFundId(e.target.value)}
              className="field-input"
            >
              <option value="">—</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.type})
                </option>
              ))}
              <option value="__new_savings__">+ New savings fund</option>
              <option value="__new_gift__">+ New gift fund</option>
            </select>
          </LineItemField>
          <button
            type="button"
            className="btn-ghost self-start px-3 py-1.5 text-sm"
            onClick={() => void creditFund()}
          >
            Credit refund
          </button>
        </div>
      ) : null}
    </div>
  )
}
