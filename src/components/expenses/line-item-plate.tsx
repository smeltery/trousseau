import { useState } from 'react'
import { parseMoneyInput } from '../../lib/money'

/** Ephemeral guests × $/plate helper; Apply sets expected amount. */
export function LineItemPlateHelper({ onApply }: { onApply: (amount: number) => void }) {
  const [open, setOpen] = useState(false)
  const [guests, setGuests] = useState('')
  const [plate, setPlate] = useState('')

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
              placeholder="0"
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
              const g = Number.parseFloat(guests)
              const p = parseMoneyInput(plate)
              if (!(g > 0) || !(p > 0)) return
              onApply(Math.round(g * p * 100) / 100)
            }}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  )
}
