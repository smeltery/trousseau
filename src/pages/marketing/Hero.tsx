import { Link } from 'react-router-dom'
import { MarketingRings } from '../../components/MarketingRings'
import { SiteNav } from '../../components/SiteNav'

export function MarketingHero() {
  return (
    <header className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-[var(--grove)] px-6 pb-16 pt-28 text-[var(--on-dark)] sm:px-10 lg:px-16 lg:pb-20">
      <SiteNav variant="marketing" />
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
        <MarketingRings className="w-full select-none opacity-95 animate-[float-soft_11s_ease-in-out_infinite]" />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--max)] animate-[rise-in_1s_var(--ease-out)_both]">
        <p className="mb-6 text-[0.7rem] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
          Local-first wedding budget
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,16vw,9rem)] leading-[0.86] font-normal tracking-[-0.045em]">
          Trousseau
        </h1>
        <p className="mt-5 max-w-xl font-[family-name:var(--font-display)] text-[clamp(1.5rem,3.5vw,2rem)] leading-snug tracking-[-0.02em] text-[var(--accent)]">
          A wedding budget that lives with you
        </p>
        <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-[var(--on-dark-muted)] sm:text-base sm:leading-7">
          Track gifts, savings, and every vendor line. Private in your browser, editable to your liking.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Link to="/app" className="btn-primary">
            Start your tracker
          </Link>
          <Link
            to="/app?demo=1"
            className="text-sm font-medium tracking-wide text-[var(--on-dark-muted)] underline decoration-[var(--accent)] decoration-1 underline-offset-8 transition-colors hover:text-[var(--on-dark)]"
          >
            Try a filled demo
          </Link>
        </div>
      </div>
    </header>
  )
}
