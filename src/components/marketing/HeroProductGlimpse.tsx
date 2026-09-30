/** Static crop of the tracker UI for the marketing hero. */
export function HeroProductGlimpse({ className = '' }: { className?: string }) {
  return (
    <aside aria-hidden className={`hero-glimpse select-none ${className}`.trim()}>
      <div className="bg-[var(--grove)] px-4 pt-[1.125rem] pb-5 sm:px-6 sm:pt-5 sm:pb-7">
        <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
          Wedding budget
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-[1.5rem] leading-[0.92] tracking-[-0.03em] text-[var(--on-dark)] sm:mt-2 sm:text-[clamp(2rem,5vw,3.25rem)]">
          Alex&nbsp;&amp;&nbsp;Jordan
        </p>
        <p className="mt-2.5 text-[15px] leading-[18px] text-[color-mix(in_srgb,var(--on-dark)_72%,transparent)] sm:mt-3 sm:leading-6 sm:text-base">
          Left to spend{' '}
          <span className="font-[family-name:var(--font-display)] text-[1.125rem] text-[var(--on-dark)] sm:text-[1.375rem]">
            $22,260
          </span>
        </p>
        <p className="mt-1 text-xs leading-[14px] text-[color-mix(in_srgb,var(--on-dark)_45%,transparent)] sm:text-xs sm:leading-4">
          $7,240 paid · $29,500 allocated
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 sm:mt-4">
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-[var(--grove)] sm:px-[1.125rem] sm:py-3 sm:text-[13px]">
            Add expense
          </span>
          <span className="hidden text-[13px] font-medium text-[color-mix(in_srgb,var(--on-dark)_55%,transparent)] underline underline-offset-4 sm:inline">
            See gifts &amp; savings
          </span>
        </div>
      </div>

      {/* Mobile: compact strip */}
      <div className="bg-[var(--mist)] px-4 py-4 text-[var(--ink)] sm:hidden">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lichen)] uppercase">
          Where it comes from
        </p>
        <p className="mt-2.5 font-[family-name:var(--font-display)] text-xl leading-[30px]">
          Gift Summary
        </p>
        <div className="mt-2.5 flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--ink)_10%,transparent)] pt-2">
          <span className="text-[13px] leading-4">Family gift</span>
          <span className="font-[family-name:var(--font-display)] text-lg leading-[22px]">18000</span>
        </div>
        <div className="mt-0 flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--ink)_10%,transparent)] pt-2">
          <span className="text-[13px] leading-4">Couple savings</span>
          <span className="font-[family-name:var(--font-display)] text-lg leading-[22px]">9000</span>
        </div>
      </div>

      {/* Desktop: two-column gift summary + total */}
      <div className="hidden bg-[var(--mist)] px-6 pt-5 pb-4 text-[var(--ink)] sm:block sm:pt-7 sm:pb-5">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          Where it comes from
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.05] tracking-[-0.02em]">
          Gift Summary
        </p>

        <div className="mt-5 flex flex-row gap-7">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between pb-2.5">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--ink-faint)] uppercase">
                Gift source
              </span>
              <span className="text-xs font-semibold text-[var(--accent-deep)]">Add</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--ink)_10%,transparent)] py-3">
              <span className="text-sm">Family gift</span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                18000
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--ink)_10%,transparent)] py-3">
              <span className="text-sm">Friends &amp; shower</span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                2500
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between pb-2.5">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--ink-faint)] uppercase">
                Wedding savings
              </span>
              <span className="text-xs font-semibold text-[var(--accent-deep)]">Add</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--ink)_10%,transparent)] py-3">
              <span className="text-sm">Couple savings</span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                9000
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden items-baseline justify-between gap-4 bg-[var(--mist)] px-6 pt-2 pb-7 text-[var(--ink)] sm:flex">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
          Total allocated
        </p>
        <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2rem)] tracking-[-0.02em]">
          $29,500
        </p>
      </div>
    </aside>
  )
}
