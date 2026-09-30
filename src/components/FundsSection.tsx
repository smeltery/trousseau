import { useState } from 'react'
import { db, newId } from '../db/dexie'
import type { Fund, FundType } from '../db/types'
import { parseMoneyInput, sum } from '../lib/money'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { showToast } from '../lib/toast'
import { EditableText } from './EditableText'
import { SettlingMoney } from './SettlingMoney'

interface FundsSectionProps {
  site: SiteSettings
  funds: Fund[]
}

export function FundsSection({ site, funds }: FundsSectionProps) {
  const gifts = funds.filter((f) => f.type === 'gift').sort((a, b) => a.sort - b.sort)
  const savings = funds.filter((f) => f.type === 'savings').sort((a, b) => a.sort - b.sort)
  const allocated = sum(funds.map((f) => f.amount))

  return (
    <section id="gift-summary" className="scroll-mt-24 overflow-x-clip bg-[var(--mist)] page-pad py-24">
      <div className="page-shell">
        <div className="max-w-[560px]">
          <EditableText
            aria-label="Funds section eyebrow"
            value={site.fundsEyebrow}
            onSave={(fundsEyebrow) => patchSiteSettings({ fundsEyebrow })}
            className="w-full text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase"
          />
          <EditableText
            aria-label="Funds section title"
            value={site.fundsTitle}
            onSave={(fundsTitle) => patchSiteSettings({ fundsTitle })}
            className="mt-4 w-full font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]"
          />
          <EditableText
            aria-label="Funds section description"
            value={site.fundsSub}
            onSave={(fundsSub) => patchSiteSettings({ fundsSub })}
            multiline
            className="mt-4 w-full text-base leading-[26px] text-[var(--ink-muted)]"
          />
        </div>

        <div className="mt-14 flex flex-col gap-14 lg:flex-row lg:gap-20">
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

        <div className="mt-14 flex items-baseline justify-between gap-6 pt-2">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
            Total allocated
          </p>
          <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.25rem)] tracking-[-0.02em]">
            <SettlingMoney value={allocated} />
          </p>
        </div>
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
    <div className="min-w-0 flex-1">
      <div className="mb-0 flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-3">
        <EditableText
          aria-label={`${title} column title`}
          value={title}
          onSave={onRenameTitle}
          className="w-full text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase"
        />
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4 hover:text-[var(--ink)]"
          onClick={async () => {
            const sort = funds.length ? Math.max(...funds.map((f) => f.sort)) + 1 : 0
            await dbWrite(() =>
              db.funds.add({
                id: newId('fund'),
                label: type === 'gift' ? 'New gift' : 'New savings',
                amount: 0,
                type,
                sort,
              }),
            )
            showToast(type === 'gift' ? 'Gift added' : 'Savings added')
          }}
        >
          Add
        </button>
      </div>

      {funds.length === 0 ? (
        <p className="py-5 text-[var(--ink-faint)]">{emptyLabel}</p>
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
  const [saved, setSaved] = useState(false)

  function flashSaved() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 550)
  }

  return (
    <li
      className={`group flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] ${
        saved ? 'editable-saved' : ''
      }`}
    >
      <input
        aria-label="Fund name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={async () => {
          const next = label.trim() || fund.label
          setLabel(next)
          if (next !== fund.label) {
            await dbWrite(() => db.funds.update(fund.id, { label: next }))
            flashSaved()
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-xl leading-6 outline-none transition-colors focus:text-[var(--accent-deep)]"
      />
      <input
        aria-label={`${fund.label} amount`}
        inputMode="decimal"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        onBlur={async () => {
          const amount = parseMoneyInput(amountText)
          setAmountText(String(amount))
          if (amount !== fund.amount) {
            await dbWrite(() => db.funds.update(fund.id, { amount }))
            flashSaved()
          }
        }}
        onFocus={(e) => e.target.select()}
        className="w-[140px] shrink-0 bg-transparent text-right font-[family-name:var(--font-display)] text-[28px] leading-[34px] tracking-[-0.02em] outline-none focus:text-[var(--accent-deep)]"
      />
      <button
        type="button"
        aria-label={`Remove ${fund.label}`}
        className="shrink-0 text-sm text-[var(--ink-faint)] hover:text-[var(--danger)]"
        onClick={async () => {
          const ok = await askConfirm({
            title: `Remove “${fund.label}”?`,
            confirmLabel: 'Remove',
            danger: true,
          })
          if (!ok) return
          await dbWrite(() => db.funds.delete(fund.id))
          showToast('Removed')
        }}
      >
        Remove
      </button>
    </li>
  )
}
