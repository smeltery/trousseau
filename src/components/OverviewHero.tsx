import { MarketingRings } from './MarketingRings'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { EditableText } from './EditableText'
import { SettlingMoney } from './SettlingMoney'
import { SiteNav } from './SiteNav'

interface OverviewHeroProps {
  site: SiteSettings
  allocated: number
  spent: number
  remaining: number
  onAddExpense: () => void
}

export function OverviewHero({
  site,
  allocated,
  spent,
  remaining,
  onAddExpense,
}: OverviewHeroProps) {
  const over = remaining < 0
  const blankNames = site.brandLeft === 'Groom' && site.brandRight === 'Bride'

  return (
    <header className="hero-surface page-pad">
      <SiteNav variant="app" />
      <div aria-hidden className="hero-glow animate-[drift-light_14s_ease-in-out_infinite]" />
      <MarketingRings className="hero-rings select-none" />

      <div className="page-shell relative z-[1] animate-[rise-in_1s_var(--ease-out)_both]">
        <div className="flex max-w-[720px] flex-col items-start gap-8">
          <EditableText
            aria-label="Hero eyebrow"
            value={site.heroEyebrow}
            onSave={(heroEyebrow) => patchSiteSettings({ heroEyebrow })}
            className="text-[11px] font-semibold leading-[14px] tracking-[0.28em] text-[var(--accent)] uppercase"
          />

          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]">
            <EditableText
              aria-label="First name"
              value={site.brandLeft}
              onSave={(brandLeft) => patchSiteSettings({ brandLeft })}
              className="inline-block align-baseline font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]"
            />
            <span className="mx-[0.12em]" aria-hidden>
              &amp;
            </span>
            <EditableText
              aria-label="Second name"
              value={site.brandRight}
              onSave={(brandRight) => patchSiteSettings({ brandRight })}
              className="inline-block align-baseline font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]"
            />
          </h1>

          {blankNames ? (
            <p className="animate-[fade-in_0.6s_var(--ease-out)_both] text-sm text-[var(--on-dark-faint)]">
              Click the names to make them yours
            </p>
          ) : null}

          <div className="flex max-w-[420px] flex-col gap-2">
            <p className={`text-lg leading-7 text-[var(--on-dark-muted)] ${over ? 'text-[#f0a090]' : ''}`}>
              {over ? 'Over budget by' : 'Left to spend'}{' '}
              <SettlingMoney value={Math.abs(remaining)} />
            </p>
            <p className="text-sm leading-[18px] tracking-[0.02em] text-[var(--on-dark-faint)]">
              <SettlingMoney value={spent} /> paid · <SettlingMoney value={allocated} /> allocated
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-7 pt-4">
            <button type="button" onClick={onAddExpense} className="btn-primary">
              Add expense
            </button>
            <a href="#gift-summary" className="link-quiet">
              See gifts &amp; savings
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
