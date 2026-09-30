import { Link } from 'react-router-dom'
import { FooterLegalBar } from '../../components/nav/FooterLegalBar'
import { TrousseauLogo } from '../../components/TrousseauLogo'
import { footerColumns, type FooterLink } from './content'

function FooterNavLink({ link }: { link: FooterLink }) {
  return (
    <Link
      to={link.to}
      className="text-[0.95rem] font-medium text-[var(--on-dark)] transition-colors hover:text-[var(--accent)]"
    >
      {link.label}
    </Link>
  )
}

export function MarketingFooter() {
  return (
    <footer className="bg-[#071410] page-pad text-[var(--on-dark)]">
      <div className="page-shell pt-14 pb-10 sm:pt-20 sm:pb-12">
        <div className="flex flex-col gap-12 sm:gap-16 lg:flex-row lg:justify-between lg:gap-20">
          <div className="max-w-md">
            <TrousseauLogo
              onDark
              markClassName="h-9 w-auto sm:h-10"
              wordClassName="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,2.75rem)] leading-none tracking-[-0.03em] text-[var(--on-dark)]"
            />
            <p className="mt-4 text-[var(--on-dark-muted)]">
              A shared wedding budget that stays with you until the day arrives.
            </p>
          </div>

          <div className="grid w-full max-w-lg grid-cols-2 gap-x-8 gap-y-10 sm:flex sm:max-w-none sm:flex-wrap sm:gap-16">
            {footerColumns.map((col) => (
              <div key={col.title} className="min-w-0 sm:min-w-[7rem]">
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
          </div>
        </div>

        <FooterLegalBar />
      </div>
    </footer>
  )
}
