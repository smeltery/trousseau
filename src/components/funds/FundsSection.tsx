import { patchSiteSettings, type SiteSettings } from '../../lib/site-settings'
import { sectionScrollMt } from '../../lib/ux/scroll-mt'
import { sum } from '../../lib/money'
import type { Fund } from '../../db/types'
import { EditableText } from '../EditableText'
import { SettlingMoney } from '../SettlingMoney'
import { FundGroup } from './FundGroup'

interface FundsSectionProps {
  site: SiteSettings
  funds: Fund[]
  syncBanner?: boolean
}

export function FundsSection({ site, funds, syncBanner = false }: FundsSectionProps) {
  const gifts = funds.filter((f) => f.type === 'gift').sort((a, b) => a.sort - b.sort)
  const savings = funds.filter((f) => f.type === 'savings').sort((a, b) => a.sort - b.sort)
  const allocated = sum(funds.map((f) => f.amount))

  return (
    <section
      id="gift-summary"
      className={`${sectionScrollMt(syncBanner)} overflow-x-clip bg-[var(--mist)] page-pad py-24`}
    >
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
            emptyWhy="Cash gifts and checks that fund the day."
          />
          <FundGroup
            title={site.savingsColumn}
            onRenameTitle={(savingsColumn) => patchSiteSettings({ savingsColumn })}
            type="savings"
            funds={savings}
            emptyLabel="No savings yet"
            emptyWhy="What you’ve set aside together for the wedding."
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
