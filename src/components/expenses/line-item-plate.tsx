import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import { parseMoneyInput } from '../../lib/money'
import {
  DEFAULT_SITE,
  parseSiteSettings,
  SITE_META_KEY,
} from '../../lib/site-settings'
import { plateAmount } from '../../lib/ux/guest-plate'
import { showToast } from '../../lib/toast'

/** Guests × $/plate helper; uses site guestCount when set; can link line to per-guest. */
export function LineItemPlateHelper({
  perGuestAmount,
  onApply,
  onLinkPerGuest,
}: {
  perGuestAmount?: number
  onApply: (amount: number) => void
  onLinkPerGuest: (perGuest: number | undefined) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE
  const [open, setOpen] = useState(false)
  const [guests, setGuests] = useState(
    site.guestCount != null ? String(site.guestCount) : '',
  )
  const [plate, setPlate] = useState(perGuestAmount != null ? String(perGuestAmount) : '')

  return (
    <div className="-mt-2">
      <button
        type="button"
        className="text-xs font-semibold tracking-wide text-[var(--accent-deep)] hover:underline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Hide guest × plate' : 'Estimate from guests × $/plate'}
      </button>
      {open ? (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="min-w-[5rem] flex-1">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)] uppercase">
              Guests
            </span>
            <input
              inputMode="numeric"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="field-input py-1.5 text-sm"
              placeholder={site.guestCount != null ? String(site.guestCount) : '0'}
            />
          </label>
          <label className="min-w-[5rem] flex-1">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)] uppercase">
              $/plate
            </span>
            <input
              inputMode="decimal"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="field-input py-1.5 text-sm"
              placeholder="0"
            />
          </label>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-sm"
            onClick={() => {
              const g = Number.parseFloat(guests) || site.guestCount || 0
              const p = parseMoneyInput(plate)
              if (!(g > 0) || !(p > 0)) {
                showToast('Enter guests and $/plate')
                return
              }
              onApply(plateAmount(g, p))
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-sm"
            onClick={() => {
              const p = parseMoneyInput(plate)
              if (!(p > 0)) {
                showToast('Enter $/plate to link')
                return
              }
              onLinkPerGuest(p)
              const g = Number.parseFloat(guests) || site.guestCount || 0
              if (g > 0) onApply(plateAmount(g, p))
              showToast('Linked to guest count')
            }}
          >
            Link to headcount
          </button>
          {perGuestAmount != null ? (
            <button
              type="button"
              className="text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]"
              onClick={() => onLinkPerGuest(undefined)}
            >
              Unlink
            </button>
          ) : null}
        </div>
      ) : null}
      {perGuestAmount != null && site.guestCount != null ? (
        <p className="mt-1 text-xs text-[var(--ink-faint)]">
          Linked · {site.guestCount} guests × ${perGuestAmount}/plate
        </p>
      ) : null}
    </div>
  )
}
