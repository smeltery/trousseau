import { useState } from 'react'
import { parseMoneyInput } from '../../lib/money'

/** Ephemeral % helpers: deposit of expected, or tip on expected. */
export function LineItemPercentHelpers({
  expected,
  onApplyPaid,
  onApplyAmount,
}: {
  expected: number
  onApplyPaid: (paid: number) => void
  onApplyAmount: (amount: number) => void
}) {
  const [open, setOpen] = useState<'deposit' | 'tip' | null>(null)
  const [pct, setPct] = useState('')

  return (
    <div className="-mt-2 space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="text-xs font-semibold tracking-wide text-[var(--accent-deep)] hover:underline"
          onClick={() => setOpen((v) => (v === 'deposit' ? null : 'deposit'))}
          aria-expanded={open === 'deposit'}
        >
          {open === 'deposit' ? 'Hide deposit %' : 'Deposit % of expected'}
        </button>
        <button
          type="button"
          className="text-xs font-semibold tracking-wide text-[var(--accent-deep)] hover:underline"
          onClick={() => setOpen((v) => (v === 'tip' ? null : 'tip'))}
          aria-expanded={open === 'tip'}
        >
          {open === 'tip' ? 'Hide tip %' : 'Add tip / gratuity %'}
        </button>
      </div>
      {open ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[5rem]">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)] uppercase">
              {open === 'deposit' ? 'Deposit %' : 'Tip %'}
            </span>
            <input
              inputMode="decimal"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              className="field-input py-1.5 text-sm"
              placeholder={open === 'deposit' ? '50' : '18'}
            />
          </label>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-sm"
            disabled={!(expected > 0)}
            onClick={() => {
              const p = parseMoneyInput(pct)
              if (!(p > 0) || !(expected > 0)) return
              if (open === 'deposit') {
                onApplyPaid(Math.round(expected * (p / 100) * 100) / 100)
              } else {
                onApplyAmount(Math.round(expected * (1 + p / 100) * 100) / 100)
              }
              setPct('')
            }}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  )
}
