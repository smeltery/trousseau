import { Link } from 'react-router-dom'
import { MarketingRings } from '../../components/MarketingRings'
import { SiteNav } from '../../components/SiteNav'

export function MarketingHero() {
  return (
    <header className="hero-surface page-pad">
      <SiteNav variant="marketing" />
      <div aria-hidden className="hero-glow animate-[drift-light_14s_ease-in-out_infinite]" />
      <MarketingRings className="hero-rings select-none" />

      <div className="page-shell relative z-[1] animate-[rise-in_1s_var(--ease-out)_both]">
        <div className="flex max-w-[820px] flex-col items-start gap-5">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.28em] text-[var(--accent)] uppercase">
          Local-first wedding budget
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,12vw,8.75rem)] leading-[0.86] tracking-[-0.045em]">
          Trousseau
        </h1>
        <p className="max-w-[520px] pt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] leading-10 tracking-[-0.02em] text-[var(--accent)]">
          A wedding budget that lives with you
        </p>
        <p className="max-w-[400px] text-[17px] leading-7 text-[var(--on-dark-muted)]">
          Track gifts, savings, and every vendor line. Private in your browser, editable to your liking.
        </p>
        <div className="flex flex-wrap items-center gap-7 pt-5">
          <Link to="/app?new=1" className="btn-primary">
            Start your tracker
          </Link>
          <Link to="/app?demo=1" className="link-quiet">
            Try a filled demo
          </Link>
        </div>
        </div>
      </div>
    </header>
  )
}
