import { Link } from 'react-router-dom'
import { HeroProductGlimpse } from '../../components/marketing/HeroProductGlimpse'
import { SiteNav } from '../../components/SiteNav'

export function MarketingHero() {
  return (
    <header className="hero-surface hero-surface-marketing page-pad">
      <SiteNav variant="marketing" />
      <div
        aria-hidden
        className="hero-glow hero-glow-marketing animate-[drift-light_14s_ease-in-out_infinite]"
      />

      <div className="page-shell relative z-[1] flex flex-col gap-10 pt-2 lg:flex-row lg:items-end lg:justify-between lg:gap-14 lg:pt-4">
        <div className="flex w-full max-w-[36rem] flex-col items-start gap-5 animate-[rise-in_1s_var(--ease-out)_both] lg:max-w-[32rem] xl:max-w-[36rem]">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.28em] text-[var(--accent)] uppercase">
            Shared wedding budget
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.9] tracking-[-0.045em] sm:leading-[0.86]">
            Trousseau
          </h1>
          <p className="max-w-[520px] pt-1 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3.2vw,2.5rem)] leading-snug tracking-[-0.02em] text-[var(--accent)] sm:pt-2 sm:leading-[1.15]">
            One wedding budget for both of you, synced by a secret link.
          </p>
          <p className="max-w-[400px] text-[16px] leading-7 text-[var(--on-dark-muted)] sm:hidden">
            No accounts. Treat the share link like a password.
          </p>
          <p className="hidden max-w-[400px] text-[16px] leading-7 text-[var(--on-dark-muted)] sm:block sm:text-[17px]">
            Gifts in. Vendors out. Receipts beside the dollars. No accounts. Treat the URL like a
            password.
          </p>

          <div className="order-last flex w-full flex-col items-stretch gap-3 pt-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-7 lg:order-none lg:pt-5">
            <Link
              to="/app?new=1"
              className="btn-primary w-full animate-[rise-in_1.05s_var(--ease-out)_both] sm:w-auto"
            >
              Start your tracker
            </Link>
            <Link
              to="/app?demo=1"
              className="flex w-full items-center justify-center border border-[color-mix(in_srgb,var(--accent)_65%,transparent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] hover:text-[var(--on-dark)] sm:hidden"
            >
              Try a filled demo
            </Link>
            <Link
              to="/app?demo=1"
              className="hidden text-sm font-semibold tracking-wide text-[var(--accent)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)] sm:inline"
            >
              Try a filled demo
            </Link>
          </div>

          <HeroProductGlimpse className="w-full max-w-[28rem] lg:hidden" />
        </div>

        <div className="hidden w-full max-w-[32rem] shrink-0 animate-[rise-in_1.2s_var(--ease-out)_both] lg:block xl:max-w-[34rem]">
          <HeroProductGlimpse className="w-full" />
        </div>
      </div>
    </header>
  )
}
