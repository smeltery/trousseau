import { formatMoney } from '../lib/money'
import { sketches } from '../lib/sketches'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { EditableText } from './EditableText'

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

  return (
    <header className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-[var(--grove)] px-6 pb-16 pt-24 text-[var(--on-dark)] sm:px-10 lg:px-16 lg:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_86%_6%,color-mix(in_srgb,var(--accent)_38%,transparent),transparent_62%),radial-gradient(ellipse_55%_45%_at_8%_92%,color-mix(in_srgb,var(--lichen)_24%,transparent),transparent_52%),linear-gradient(165deg,var(--grove-mid),var(--grove)_52%,#071410_100%)] animate-[drift-light_14s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[12%] -right-[8%] h-[min(70vw,560px)] w-[min(90vw,680px)] rounded-full bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_42%,transparent),color-mix(in_srgb,var(--grove-mid)_35%,transparent)_42%,transparent_72%)] blur-[2px] animate-[float-soft_11s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-20 w-[min(92vw,680px)] [mask-image:radial-gradient(ellipse_72%_68%_at_50%_42%,black_35%,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_72%_68%_at_50%_42%,black_35%,transparent_78%)] sm:-right-12 sm:-top-4"
      >
        <img
          src={sketches.rings}
          alt=""
          aria-hidden
          className="w-full select-none opacity-95 animate-[float-soft_11s_ease-in-out_infinite]"
        />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--max)] animate-[rise-in_1s_var(--ease-out)_both]">
        <EditableText
          aria-label="Hero eyebrow"
          value={site.heroEyebrow}
          onSave={(heroEyebrow) => patchSiteSettings({ heroEyebrow })}
          className="mb-5 text-[0.7rem] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase focus:text-[var(--accent)]"
        />

        <h1 className="flex flex-wrap items-baseline gap-x-[0.35em] font-[family-name:var(--font-display)] text-[clamp(3.4rem,14vw,8.5rem)] leading-[0.9] font-normal tracking-[-0.03em]">
          <EditableText
            aria-label="First name"
            value={site.brandLeft}
            onSave={(brandLeft) => patchSiteSettings({ brandLeft })}
            className="w-auto max-w-[8ch] font-[family-name:var(--font-display)] text-[clamp(3.4rem,14vw,8.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)] focus:text-[var(--accent)]"
          />
          <span className="text-[var(--accent)]" aria-hidden>
            &amp;
          </span>
          <EditableText
            aria-label="Second name"
            value={site.brandRight}
            onSave={(brandRight) => patchSiteSettings({ brandRight })}
            className="w-auto max-w-[8ch] font-[family-name:var(--font-display)] text-[clamp(3.4rem,14vw,8.5rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)] focus:text-[var(--accent)]"
          />
        </h1>

        <p className="mt-8 max-w-md text-base leading-relaxed text-[var(--on-dark-muted)] sm:text-lg">
          {over ? 'Over budget by' : 'Left to spend'}{' '}
          <span
            className={`font-[family-name:var(--font-display)] text-[1.35em] tracking-tight text-[var(--on-dark)] ${
              over ? 'text-[color-mix(in_srgb,#f0a090_90%,white)]' : ''
            }`}
          >
            {formatMoney(Math.abs(remaining))}
          </span>
          <span className="mt-2 block text-sm tracking-wide text-[var(--on-dark-muted)]">
            {formatMoney(spent)} spent · {formatMoney(allocated)} allocated
          </span>
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <button type="button" onClick={onAddExpense} className="btn-primary">
            Add expense
          </button>
          <a
            href="#gift-summary"
            className="text-sm font-medium tracking-wide text-[var(--on-dark-muted)] underline decoration-[var(--accent)] decoration-1 underline-offset-8 transition-colors hover:text-[var(--on-dark)]"
          >
            See gifts &amp; savings
          </a>
        </div>
      </div>
    </header>
  )
}
