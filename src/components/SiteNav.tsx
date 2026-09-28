import { Link } from 'react-router-dom'
import { TrousseauLogo } from './TrousseauLogo'

type SiteNavProps = {
  variant: 'marketing' | 'app'
}

export function SiteNav({ variant }: SiteNavProps) {
  return (
    <nav aria-label="Primary" className="absolute inset-x-0 top-8 z-30 page-pad">
      <div className="page-shell flex items-center justify-between gap-4">
        <Link
          to="/"
          className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <TrousseauLogo
            onDark
            markClassName="h-7 w-[36px]"
            wordClassName="font-[family-name:var(--font-display)] text-2xl leading-none tracking-[-0.03em] text-[var(--on-dark)]"
            className="gap-3"
          />
        </Link>

        {variant === 'marketing' ? (
          <div className="flex items-center gap-6">
            <Link
              to="/app?demo=1"
              className="text-sm font-medium text-[var(--on-dark-muted)] underline decoration-1 underline-offset-6 transition-colors hover:text-[var(--on-dark)]"
            >
              Demo
            </Link>
            <Link to="/app" className="btn-nav">
              Open tracker
            </Link>
          </div>
        ) : (
          <Link
            to="/"
            className="text-sm font-medium text-[var(--on-dark-muted)] transition-colors hover:text-[var(--on-dark)]"
          >
            About
          </Link>
        )}
      </div>
    </nav>
  )
}
