import { useState } from 'react'
import { MarketingRings } from './MarketingRings'
import { dismissNamesHint, isNamesHintDismissed } from '../lib/names-hint'
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
  syncBanner?: boolean
}

export function OverviewHero({
  site,
  allocated,
  spent,
  remaining,
  onAddExpense,
  syncBanner = false,
}: OverviewHeroProps) {
  const over = remaining < 0
  const blankNames = site.brandLeft === 'Groom' && site.brandRight === 'Bride'
  const [hintDismissed, setHintDismissed] = useState(() => isNamesHintDismissed())
  const showHint = blankNames && !hintDismissed

  function hideHint() {
    dismissNamesHint()
    setHintDismissed(true)
  }

  return (
    <header
      className={`hero-surface page-pad${syncBanner ? ' pt-[6.75rem] lg:pt-[7.25rem]' : ''}`}
    >
      <SiteNav variant="app" syncBanner={syncBanner} />
      <div aria-hidden className="hero-glow animate-[drift-light_14s_ease-in-out_infinite]" />
      <MarketingRings className="hero-rings select-none" />

      <div className="page-shell relative z-[1] animate-[rise-in_1s_var(--ease-out)_both]">
        <div className="flex max-w-[720px] flex-col items-start gap-5">
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
              onSave={async (brandLeft) => {
                await patchSiteSettings({ brandLeft })
                if (brandLeft !== 'Groom') hideHint()
              }}
              className="inline-block align-baseline font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]"
            />
            <span className="mx-[0.12em]" aria-hidden>
              &amp;
            </span>
            <EditableText
              aria-label="Second name"
              value={site.brandRight}
              onSave={async (brandRight) => {
                await patchSiteSettings({ brandRight })
                if (brandRight !== 'Bride') hideHint()
              }}
              className="inline-block align-baseline font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]"
            />
          </h1>

          {showHint ? (
            <button
              type="button"
              onClick={hideHint}
              className="animate-[fade-in_0.6s_var(--ease-out)_both] text-left text-sm text-[var(--on-dark-faint)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark-muted)]"
            >
              Click the names to make them yours
            </button>
          ) : null}

          <div className="flex max-w-[420px] flex-col gap-2">
            <p className={`text-lg leading-7 ${over ? 'text-[#f0a090]' : 'text-[var(--on-dark-muted)]'}`}>
              {over ? 'Over budget by' : 'Left to spend'}{' '}
              <SettlingMoney value={Math.abs(remaining)} className={over ? 'over-nudge' : ''} />
            </p>
            <p className="text-sm leading-[18px] tracking-[0.02em] text-[var(--on-dark-faint)]">
              <SettlingMoney value={spent} /> paid · <SettlingMoney value={allocated} /> allocated
            </p>
            {over ? (
              <p className="pt-1 text-sm leading-5 text-[var(--on-dark-muted)]">
                Add gifts or savings, or trim an expense to get back on track.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-7">
              {over ? (
                <>
                  <a href="#gift-summary" className="btn-primary">
                    Add funds
                  </a>
                  <a href="#expenses" className="link-quiet">
                    Review expenses
                  </a>
                </>
              ) : (
                <>
                  <button type="button" onClick={onAddExpense} className="btn-primary">
                    Add expense
                  </button>
                  <a href="#gift-summary" className="link-quiet">
                    See gifts &amp; savings
                  </a>
                </>
              )}
            </div>
            {over ? (
              <button
                type="button"
                onClick={onAddExpense}
                className="text-xs tracking-[0.04em] text-[var(--on-dark-faint)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark-muted)]"
              >
                Or add an expense
              </button>
            ) : (
              <p className="text-xs tracking-[0.04em] text-[var(--on-dark-faint)]">
                Press <kbd className="font-[family-name:var(--font-body)]">N</kbd> to add an expense
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
