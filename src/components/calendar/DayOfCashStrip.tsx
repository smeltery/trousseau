import { useState } from 'react'
import type { LineItem } from '../../db/types'
import { cashDueWeddingWeekend, todayKey } from '../../lib/calendar'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { patchSiteSettings, type DayOfCash, type SiteSettings } from '../../lib/site-settings'
import { dayOfCashTotal } from '../../lib/ux/who-pays-rollup'

/** Tip / vendor cash float vs wedding-weekend dues. */
export function DayOfCashStrip({
  site,
  items,
}: {
  site: SiteSettings
  items: LineItem[]
}) {
  const today = todayKey()
  const weekend = cashDueWeddingWeekend(items, site.weddingDate, today)
  const tip = site.dayOfCash?.tipCash ?? 0
  const vendor = site.dayOfCash?.vendorCash ?? 0
  const floatTotal = dayOfCashTotal(tip, vendor)
  const [tipText, setTipText] = useState(tip > 0 ? String(tip) : '')
  const [vendorText, setVendorText] = useState(vendor > 0 ? String(vendor) : '')
  const [open, setOpen] = useState(false)

  async function save(next: DayOfCash | undefined) {
    await patchSiteSettings({ dayOfCash: next })
  }

  if (weekend <= 0 && floatTotal <= 0 && !open) {
    return (
      <button
        type="button"
        className="text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4"
        onClick={() => setOpen(true)}
      >
        Plan day-of cash float
      </button>
    )
  }

  const short = floatTotal > 0 && weekend > floatTotal

  return (
    <div className="space-y-2 text-sm text-[var(--ink-muted)]">
      <p>
        <span className="font-semibold text-[var(--accent-deep)]">Day-of cash · </span>
        {floatTotal > 0 ? (
          <>
            {formatMoney(floatTotal)} float
            {tip > 0 || vendor > 0 ? (
              <span className="text-[var(--ink-faint)]">
                {' '}
                ({tip > 0 ? `${formatMoney(tip)} tip` : ''}
                {tip > 0 && vendor > 0 ? ' · ' : ''}
                {vendor > 0 ? `${formatMoney(vendor)} vendor` : ''})
              </span>
            ) : null}
          </>
        ) : (
          <>not set</>
        )}
        {weekend > 0 ? (
          <>
            <span className="text-[var(--ink-faint)]"> · </span>
            <span className={short ? 'text-[var(--danger)]' : ''}>
              {formatMoney(weekend)} wedding weekend
              {short ? ' (short)' : ''}
            </span>
          </>
        ) : null}
        <button
          type="button"
          className="ml-2 font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide' : 'Edit'}
        </button>
      </p>
      {open ? (
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)] uppercase">
              Tip cash
            </span>
            <input
              inputMode="decimal"
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              onBlur={async () => {
                const tipCash = parseMoneyInput(tipText)
                const vendorCash = parseMoneyInput(vendorText)
                setTipText(tipCash > 0 ? String(tipCash) : '')
                await save(
                  tipCash > 0 || vendorCash > 0
                    ? {
                        tipCash: tipCash > 0 ? tipCash : undefined,
                        vendorCash: vendorCash > 0 ? vendorCash : undefined,
                      }
                    : undefined,
                )
              }}
              className="field-input w-28 py-1.5 text-sm"
              placeholder="0"
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)] uppercase">
              Vendor cash
            </span>
            <input
              inputMode="decimal"
              value={vendorText}
              onChange={(e) => setVendorText(e.target.value)}
              onBlur={async () => {
                const tipCash = parseMoneyInput(tipText)
                const vendorCash = parseMoneyInput(vendorText)
                setVendorText(vendorCash > 0 ? String(vendorCash) : '')
                await save(
                  tipCash > 0 || vendorCash > 0
                    ? {
                        tipCash: tipCash > 0 ? tipCash : undefined,
                        vendorCash: vendorCash > 0 ? vendorCash : undefined,
                      }
                    : undefined,
                )
              }}
              className="field-input w-28 py-1.5 text-sm"
              placeholder="0"
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
