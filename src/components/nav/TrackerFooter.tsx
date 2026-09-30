import { Link, type To } from 'react-router-dom'
import { FooterLegalBar } from './FooterLegalBar'
import { TrousseauLogo } from '../TrousseauLogo'

type FooterLink =
  | { label: string; to: To }
  | { label: string; href: string }

const linkClass =
  'text-[0.95rem] font-medium text-[var(--on-dark)] transition-colors hover:text-[var(--accent)]'

/** Marketing `/` section ids: name, how, due, privacy, backup, questions. */
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Navigate',
    links: [
      { label: 'Gift summary', href: '#gift-summary' },
      { label: 'Expenses', href: '#expenses' },
      { label: 'Calendar', href: '#calendar' },
      { label: 'Backup', href: '#backup' },
    ],
  },
  {
    title: 'Trousseau',
    links: [
      { label: 'The name', to: { pathname: '/', hash: 'name' } },
      { label: 'How it works', to: { pathname: '/', hash: 'how' } },
      { label: 'Due dates', to: { pathname: '/', hash: 'due' } },
      { label: 'Privacy', to: { pathname: '/', hash: 'privacy' } },
      { label: 'Backup', to: { pathname: '/', hash: 'backup' } },
      { label: 'Questions', to: { pathname: '/', hash: 'questions' } },
    ],
  },
]

function FooterNavLink({ link }: { link: FooterLink }) {
  if ('to' in link) {
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    )
  }

  return (
    <a href={link.href} className={linkClass}>
      {link.label}
    </a>
  )
}

/** Quiet end chrome for the tracker — brand, product line, useful links. */
export function TrackerFooter() {
  return (
    <footer className="bg-[#071410] page-pad text-[var(--on-dark)]">
      <div className="page-shell pt-14 pb-10 sm:pt-20 sm:pb-12">
        <div className="flex flex-col gap-12 sm:gap-16 lg:flex-row lg:justify-between lg:gap-20">
          <div className="max-w-md">
            <Link to="/" className="inline-flex focus-visible:outline-none">
              <TrousseauLogo
                onDark
                markClassName="h-9 w-auto sm:h-10"
                wordClassName="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,2.75rem)] leading-none tracking-[-0.03em] text-[var(--on-dark)]"
              />
            </Link>
            <p className="mt-4 text-[var(--on-dark-muted)]">
              A shared wedding budget that stays with you until the day arrives.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid w-full max-w-md grid-cols-2 gap-x-10 gap-y-10 sm:max-w-none sm:gap-x-16"
          >
            {columns.map((col) => (
              <div key={col.title} className="min-w-0">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                  {col.title}
                </p>
                <ul className="mt-3.5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterNavLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <FooterLegalBar />
      </div>
    </footer>
  )
}
