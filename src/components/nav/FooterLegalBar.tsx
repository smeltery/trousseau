/** Shared copyright / legal row for marketing + tracker footers. */
export function FooterLegalBar() {
  const year = new Date().getFullYear()

  return (
    <div className="mt-12 flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)] pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)]">
        © {year} Trousseau
      </p>
      <p className="text-sm text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)]">
        A quiet wedding budget for two.
      </p>
    </div>
  )
}
