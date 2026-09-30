/** Visually hidden until focused; jumps to `#main`. */
export function SkipToMain() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-sm focus:bg-[var(--paper)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ink)] focus:shadow-[var(--sheet-shadow)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)]"
    >
      Skip to main content
    </a>
  )
}
