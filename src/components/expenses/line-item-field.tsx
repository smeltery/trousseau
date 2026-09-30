import type { ReactNode } from 'react'

export function LineItemField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
