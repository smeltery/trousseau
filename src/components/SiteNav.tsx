import { Link } from 'react-router-dom'
import { TrousseauLogo } from './TrousseauLogo'

type SiteNavProps = {
  /** Where the primary action should go. */
  variant: 'marketing' | 'app'
}

export function SiteNav({ variant }: SiteNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="absolute top-0 right-0 left-0 z-30 flex items-center justify-between gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 lg:px-16"
    >
      <Link
        to="/"
        className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
      >
        <TrousseauLogo
          onDark
          markClassName="h-7 w-auto sm:h-8"
          wordClassName="font-[family-name:var(--font-display)] text-[1.35rem] leading-none tracking-[-0.03em] text-[var(--on-dark)] sm:text-[1.5rem]"
          className="gap-2.5"
        />
      </Link>

      {variant === 'marketing' ? (
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/app?demo=1"
            className="hidden text-sm font-medium tracking-wide text-[var(--on-dark-muted)] underline decoration-[var(--accent)] decoration-1 underline-offset-6 transition-colors hover:text-[var(--on-dark)] sm:inline"
          >
            Demo
          </Link>
          <Link
            to="/app"
            className="rounded-sm bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold tracking-wide text-[var(--grove)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] sm:px-4"
          >
            Open tracker
          </Link>
        </div>
      ) : (
        <Link
          to="/"
          className="text-sm font-medium tracking-wide text-[var(--on-dark-muted)] transition-colors hover:text-[var(--on-dark)]"
        >
          About
        </Link>
      )}
    </nav>
  )
}
