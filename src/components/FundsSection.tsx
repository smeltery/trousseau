import { useState } from 'react'
import { db, newId } from '../db/dexie'
import type { Fund, FundType } from '../db/types'
import { formatMoney, parseMoneyInput } from '../lib/money'
import { sketches } from '../lib/sketches'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { EditableText } from './EditableText'

interface FundsSectionProps {
  site: SiteSettings
  funds: Fund[]
}

export function FundsSection({ site, funds }: FundsSectionProps) {
  const gifts = funds.filter((f) => f.type === 'gift').sort((a, b) => a.sort - b.sort)
  const savings = funds.filter((f) => f.type === 'savings').sort((a, b) => a.sort - b.sort)

  return (
    <section
      id="gift-summary"
      className="relative mx-auto w-full max-w-[var(--max)] px-6 py-24 sm:px-10 lg:px-16"
    >
      <img
        src={sketches.bouquet}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-10 right-0 w-36 opacity-40 select-none sm:right-6 sm:w-44"
      />

      <div className="relative max-w-xl animate-[rise-in_0.8s_var(--ease-out)_both]">
        <EditableText
          aria-label="Funds section eyebrow"
          value={site.fundsEyebrow}
          onSave={(fundsEyebrow) => patchSiteSettings({ fundsEyebrow })}
          className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase"
        />
        <EditableText
          aria-label="Funds section title"
          value={site.fundsTitle}
          onSave={(fundsTitle) => patchSiteSettings({ fundsTitle })}
          className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]"
        />
        <EditableText
          aria-label="Funds section description"
          value={site.fundsSub}
          onSave={(fundsSub) => patchSiteSettings({ fundsSub })}
          multiline
          className="mt-4 text-[var(--ink-muted)]"
        />
      </div>

      <div className="relative mt-14 grid gap-14 lg:grid-cols-2 lg:gap-16">
        <FundGroup
          title={site.giftColumn}
          onRenameTitle={(giftColumn) => patchSiteSettings({ giftColumn })}
          type="gift"
          funds={gifts}
          emptyLabel="No gifts yet"
        />
        <FundGroup
          title={site.savingsColumn}
          onRenameTitle={(savingsColumn) => patchSiteSettings({ savingsColumn })}
          type="savings"
          funds={savings}
          emptyLabel="No savings yet"
        />
      </div>
    </section>
  )
}

function FundGroup({
  title,
  onRenameTitle,
  type,
  funds,
  emptyLabel,
}: {
  title: string
  onRenameTitle: (next: string) => void | Promise<void>
  type: FundType
  funds: Fund[]
  emptyLabel: string
}) {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-3">
        <EditableText
          aria-label={`${title} column title`}
          value={title}
          onSave={onRenameTitle}
          className="text-[0.7rem] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase"
        />
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[var(--accent-deep)] hover:underline"
          onClick={async () => {
            const sort = funds.length ? Math.max(...funds.map((f) => f.sort)) + 1 : 0
            await db.funds.add({
              id: newId('fund'),
              label: type === 'gift' ? 'New gift' : 'New savings',
              amount: 0,
              type,
              sort,
            })
          }}
        >
          Add
        </button>
      </div>

      {funds.length === 0 ? (
        <p className="text-[var(--ink-faint)]">{emptyLabel}</p>
      ) : (
        <ul>
          {funds.map((fund) => (
            <FundRow key={fund.id} fund={fund} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FundRow({ fund }: { fund: Fund }) {
  const [label, setLabel] = useState(fund.label)
  const [amountText, setAmountText] = useState(String(fund.amount))

  return (
    <li className="group flex flex-col gap-2 border-b border-[var(--line-soft)] py-5 sm:flex-row sm:items-center sm:gap-4">
      <input
        aria-label="Fund name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={async () => {
          const next = label.trim() || fund.label
          setLabel(next)
          if (next !== fund.label) await db.funds.update(fund.id, { label: next })
        }}
        className="min-w-0 flex-1 bg-transparent text-xl outline-none transition-colors focus:text-[var(--accent-deep)]"
      />
      <div className="flex items-center gap-3">
        <input
          aria-label={`${fund.label} amount`}
          inputMode="decimal"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          onBlur={async () => {
            const amount = parseMoneyInput(amountText)
            setAmountText(String(amount))
            if (amount !== fund.amount) await db.funds.update(fund.id, { amount })
          }}
          onFocus={(e) => e.target.select()}
          className="w-32 bg-transparent text-right font-[family-name:var(--font-display)] text-2xl outline-none focus:text-[var(--accent-deep)]"
        />
        <span className="sr-only">{formatMoney(fund.amount)}</span>
        <button
          type="button"
          aria-label={`Remove ${fund.label}`}
          className="text-sm text-[var(--ink-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)] focus:opacity-100"
          onClick={async () => {
            if (confirm(`Remove “${fund.label}”?`)) await db.funds.delete(fund.id)
          }}
        >
          Remove
        </button>
      </div>
    </li>
  )
}
