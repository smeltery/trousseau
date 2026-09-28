import { Link } from 'react-router-dom'
import { TrousseauLogo } from '../../components/TrousseauLogo'
import { footerColumns } from './content'

export function MarketingFooter() {
  return (
    <footer className="bg-[#071410] page-pad text-[var(--on-dark)]">
      <div className="page-shell pt-20 pb-12">
        <div className="flex flex-col gap-16 lg:flex-row lg:justify-between lg:gap-20">
          <div className="max-w-md">
            <TrousseauLogo
              onDark
              markClassName="h-10 w-auto"
              wordClassName="font-[family-name:var(--font-display)] text-[clamp(2.25rem,4vw,2.75rem)] leading-none tracking-[-0.03em] text-[var(--on-dark)]"
            />
            <p className="mt-4 text-[var(--on-dark-muted)]">
              A wedding budget that lives with you. Private, editable, and ready when you are.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-16">
            {footerColumns.map((col) => (
              <div key={col.title} className="min-w-[7rem]">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)] uppercase">
                  {col.title}
                </p>
                <ul className="mt-3.5 space-y-3">
                  {'links' in col
                    ? col.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            to={link.to}
                            className="text-[0.95rem] font-medium text-[var(--on-dark)] transition-colors hover:text-[var(--accent)]"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))
                    : col.items.map((item) => (
                        <li key={item} className="text-[0.95rem] font-medium text-[var(--on-dark)]">
                          {item}
                        </li>
                      ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)]">
            Private by default · Made for wedding season
          </p>
          <p className="text-sm text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)]">
            © Trousseau
          </p>
        </div>
      </div>
    </footer>
  )
}
