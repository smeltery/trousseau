import { useState } from 'react'
import type { Fund } from '../../db/types'
import { todayKey } from '../../lib/calendar'
import { formatMoney, parseMoneyInput } from '../../lib/money'
import { patchSiteSettings, type SiteSettings } from '../../lib/site-settings'
import { savingsContributionPace } from '../../lib/ux/savings-plan'

export function SavingsPlanCard({
  site,
  funds,
}: {
  site: SiteSettings
  funds: Fund[]
}) {
  const [targetText, setTargetText] = useState(
    site.savingsPlan?.targetAmount != null ? String(site.savingsPlan.targetAmount) : '',
  )
  const pace = savingsContributionPace(
    funds,
    site.savingsPlan?.targetAmount ?? 0,
    site.weddingDate,
    todayKey(),
  )

  return (
    <div className="mt-10 rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-5 py-5">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
        Savings plan
      </p>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Set a wedding-date savings target to see the monthly pace from what you have now.
      </p>
      <label className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
          Target
        </span>
        <input
          inputMode="decimal"
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          onBlur={async () => {
            const n = parseMoneyInput(targetText)
            setTargetText(n > 0 ? String(n) : '')
            await patchSiteSettings({ savingsPlan: n > 0 ? { targetAmount: n } : undefined })
          }}
          placeholder="0"
          className="field-input max-w-[10rem] py-1.5 text-sm"
        />
      </label>
      {pace ? (
        <p className="mt-3 text-sm tabular-nums text-[var(--ink-muted)]">
          {formatMoney(pace.saved)} saved
          {pace.onTrack ? (
            <> · target met</>
          ) : (
            <>
              {' '}
              · {formatMoney(pace.remaining)} to go · ~{formatMoney(pace.monthlyPace)}/mo
              {site.weddingDate ? ' until the wedding' : ''}
            </>
          )}
        </p>
      ) : site.savingsPlan?.targetAmount ? (
        <p className="mt-3 text-sm text-[var(--ink-faint)]">Set a wedding date to see monthly pace.</p>
      ) : null}
    </div>
  )
}
