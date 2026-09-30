import { useState } from 'react'
import type { LineItem } from '../db/types'
import { dismissNamesHint, isNamesHintDismissed } from '../lib/names-hint'
import { dismissHint, isHintDismissed } from '../lib/ux/onboarding-hints'
import { formatDue, weddingCountdown } from '../lib/expense-display'
import { formatMoney } from '../lib/money'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { showToast } from '../lib/toast'
import { recomputeWeddingAnchoredDues } from '../lib/ux/wedding-dues'
import { whoPaysDisplayLines } from '../lib/ux/who-pays-rollup'
import { EditableText } from './EditableText'
import { SettleTransferCue } from './SettleTransferCue'
import { SettlingMoney } from './SettlingMoney'
import { SiteNav } from './SiteNav'

interface OverviewHeroProps {
  site: SiteSettings
  allocated: number
  spent: number
  remaining: number
  liquid?: number
  fundCount?: number
  lineItems?: LineItem[]
  onAddExpense: () => void
  onOpenCommands?: () => void
  syncBanner?: boolean
  shareUrl?: string
  overdueCount?: number
  undatedUnpaidCount?: number
}

type HintKind = 'names' | 'date' | 'gift' | 'share' | 'due'

export function OverviewHero({
  site,
  allocated,
  spent,
  remaining,
  liquid,
  fundCount = 0,
  lineItems = [],
  onAddExpense,
  onOpenCommands,
  syncBanner = false,
  shareUrl,
  overdueCount = 0,
  undatedUnpaidCount = 0,
}: OverviewHeroProps) {
  const over = remaining < 0
  const blankNames = site.brandLeft === 'Groom' && site.brandRight === 'Bride'
  const [namesDismissed, setNamesDismissed] = useState(() => isNamesHintDismissed())
  const [dateDismissed, setDateDismissed] = useState(() => isHintDismissed('date'))
  const [giftDismissed, setGiftDismissed] = useState(() => isHintDismissed('gift'))
  const [shareDismissed, setShareDismissed] = useState(() => isHintDismissed('share'))
  const [dueDismissed, setDueDismissed] = useState(() => isHintDismissed('due'))
  const countdown = weddingCountdown(site.weddingDate)
  const pays = whoPaysDisplayLines(lineItems, site)

  const hint: HintKind | null = (() => {
    if (blankNames && !namesDismissed) return 'names'
    if (!site.weddingDate && !dateDismissed) return 'date'
    if (fundCount === 0 && !giftDismissed) return 'gift'
    if (shareUrl && !shareDismissed) return 'share'
    if (undatedUnpaidCount > 0 && !dueDismissed) return 'due'
    return null
  })()

  function hideHint(kind: HintKind) {
    if (kind === 'names') {
      dismissNamesHint()
      setNamesDismissed(true)
    } else if (kind === 'date') {
      dismissHint('date')
      setDateDismissed(true)
    } else if (kind === 'gift') {
      dismissHint('gift')
      setGiftDismissed(true)
    } else if (kind === 'share') {
      dismissHint('share')
      setShareDismissed(true)
    } else {
      dismissHint('due')
      setDueDismissed(true)
    }
  }

  async function copyShare() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Share link copied')
      hideHint('share')
    } catch {
      showToast(shareUrl)
    }
  }

  const hintCopy: Record<HintKind, string> = {
    names: 'Click the names to make them yours',
    date: 'Set your wedding date for a countdown',
    gift: 'Add a gift or savings to fund the day',
    share: 'Copy the share link for your partner',
    due: 'Set a due date on an unpaid expense',
  }

  return (
    <header
      className={`hero-surface overflow-x-clip page-pad${syncBanner ? ' pt-[8.5rem] lg:pt-[9.25rem]' : ''}`}
    >
      <SiteNav
        variant="app"
        syncBanner={syncBanner}
        shareUrl={shareUrl}
        onOpenCommands={onOpenCommands}
        onAddExpense={onAddExpense}
        overdueCount={overdueCount}
      />
      <div
        aria-hidden
        className="hero-glow hero-glow-budget animate-[drift-light_14s_ease-in-out_infinite]"
      />

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
                if (brandLeft !== 'Groom') hideHint('names')
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
                if (brandRight !== 'Bride') hideHint('names')
              }}
              className="inline-block align-baseline font-[family-name:var(--font-display)] text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]"
            />
          </h1>

          {hint ? (
            <button
              type="button"
              onClick={() => {
                if (hint === 'gift') {
                  hideHint('gift')
                  document.getElementById('gift-summary')?.scrollIntoView({ behavior: 'smooth' })
                  return
                }
                if (hint === 'share') {
                  void copyShare()
                  return
                }
                if (hint === 'due') {
                  hideHint('due')
                  document.getElementById('expenses')?.scrollIntoView({ behavior: 'smooth' })
                  return
                }
                hideHint(hint)
              }}
              className="animate-[fade-in_0.6s_var(--ease-out)_both] text-left text-sm text-[var(--on-dark-faint)] underline decoration-1 underline-offset-4 hover:text-[var(--on-dark-muted)]"
            >
              {hintCopy[hint]}
            </button>
          ) : null}

          <div className="flex max-w-[420px] flex-col gap-2">
            <p className={`text-lg leading-7 ${over ? 'text-[#f0a090]' : 'text-[var(--on-dark-muted)]'}`}>
              {over ? 'Over budget by' : 'Left in budget'}{' '}
              <SettlingMoney value={Math.abs(remaining)} className={over ? 'over-nudge' : ''} />
            </p>
            <p className="text-sm leading-[18px] tracking-[0.02em] text-[var(--on-dark-faint)]">
              <SettlingMoney value={spent} /> paid · <SettlingMoney value={allocated} /> allocated
              {liquid != null ? (
                <>
                  {' · '}
                  <SettlingMoney value={liquid} /> liquid
                </>
              ) : null}
            </p>
            {pays.length > 0 ? (
              <p className="text-sm leading-[18px] tracking-[0.02em] text-[var(--on-dark-faint)]">
                Who pays ·{' '}
                {pays.map((r, i) => (
                  <span key={r.label}>
                    {i > 0 ? ' · ' : ''}
                    {r.label} {formatMoney(r.amount)}
                  </span>
                ))}
              </p>
            ) : null}
            <SettleTransferCue
              site={site}
              lineItems={lineItems}
              className="text-sm leading-[18px] tracking-[0.02em] text-[var(--on-dark-faint)]"
            />
            <label className="flex flex-wrap items-center gap-2 pt-1 text-sm text-[var(--on-dark-muted)]">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-[var(--on-dark-faint)] uppercase">
                Wedding
              </span>
              <input
                type="date"
                aria-label="Wedding date"
                value={site.weddingDate ?? ''}
                onChange={(e) => {
                  const weddingDate = e.target.value || undefined
                  void (async () => {
                    await patchSiteSettings({ weddingDate })
                    if (weddingDate) {
                      await recomputeWeddingAnchoredDues(weddingDate)
                      hideHint('date')
                    }
                  })()
                }}
                className="date-on-dark rounded-sm border border-[color-mix(in_srgb,var(--on-dark)_22%,transparent)] bg-transparent px-2 py-1 text-[var(--on-dark)] outline-none focus:border-[var(--accent)]"
              />
              {site.weddingDate ? (
                <span className="text-[var(--accent)]">
                  {countdown}
                  {countdown !== 'Wedding day' ? ` · ${formatDue(site.weddingDate)}` : ''}
                </span>
              ) : (
                <span className="text-[var(--on-dark-faint)]">Set the date for a countdown</span>
              )}
            </label>
            {over ? (
              <p className="pt-1 text-sm leading-5 text-[var(--on-dark-muted)]">
                Add gifts or savings, or trim an expense to get back on track.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
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
            {shareUrl ? (
              <button type="button" onClick={() => void copyShare()} className="link-quiet">
                Copy share link
              </button>
            ) : null}
            <p className="hidden text-xs tracking-[0.04em] text-[var(--on-dark-faint)] sm:block">
              Press <kbd className="font-[family-name:var(--font-body)]">N</kbd> to add
              {onOpenCommands ? (
                <>
                  <span aria-hidden> · </span>
                  <button
                    type="button"
                    onClick={onOpenCommands}
                    className="underline decoration-1 underline-offset-4 hover:text-[var(--on-dark-muted)]"
                  >
                    <kbd className="font-[family-name:var(--font-body)]">⌘K</kbd> commands
                  </button>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
