import { Link } from 'react-router-dom'

const jumpLinkClass =
  'border-b border-[color-mix(in_srgb,var(--on-dark)_10%,transparent)] py-2.5 font-[family-name:var(--font-display)] text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[var(--on-dark)] transition-colors hover:text-[var(--accent)]'

type Section = { label: string; href: string }

type SiteNavMenuProps = {
  variant: 'marketing' | 'app'
  menuId: string
  sheetClass: string
  sections: readonly Section[]
  onJump: (href: string) => void
  onClose: () => void
  onImport: () => void
}

export function SiteNavMenu({
  variant,
  menuId,
  sheetClass,
  sections,
  onJump,
  onClose,
  onImport,
}: SiteNavMenuProps) {
  return (
    <div
      id={menuId}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={`border-b border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)] bg-[color-mix(in_srgb,var(--grove)_92%,transparent)] px-[var(--page-pad)] pt-7 pb-8 shadow-[var(--sheet-shadow)] backdrop-blur-2xl backdrop-saturate-150 animate-[drop-in_0.3s_var(--ease-out)] ${sheetClass}`}
    >
      <div className="page-shell flex flex-col gap-7">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
          Jump to
        </p>

        <div className="flex flex-col">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={(e) => {
                e.preventDefault()
                onJump(section.href)
              }}
              className={jumpLinkClass}
            >
              {section.label}
            </a>
          ))}
        </div>

        {variant === 'marketing' ? (
          <div className="flex flex-col gap-3">
            <Link to="/app?new=1" className="btn-nav w-full" onClick={onClose}>
              Start blank
            </Link>
            <Link to="/app?demo=1" className="btn-nav-demo w-full" onClick={onClose}>
              Try demo
            </Link>
            <Link
              to="/?import=1"
              onClick={onClose}
              className="w-full py-3 text-center text-sm font-medium text-[var(--on-dark-muted)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)]"
            >
              Import backup
            </Link>
          </div>
        ) : (
          <button type="button" onClick={onImport} className="btn-nav w-full">
            Import backup
          </button>
        )}
      </div>
    </div>
  )
}
