import type { ReactNode } from 'react'
import { MarketingRings } from '../components/MarketingRings'
import { TrousseauMark } from '../components/TrousseauLogo'

export function BootShell({
  children,
  busy = false,
  awaitingConfirm = false,
}: {
  children: ReactNode
  busy?: boolean
  awaitingConfirm?: boolean
}) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--grove)] page-pad text-center"
      role={busy && !awaitingConfirm ? 'status' : undefined}
      aria-busy={busy && !awaitingConfirm ? true : undefined}
      aria-live={busy && !awaitingConfirm ? 'polite' : undefined}
    >
      <div aria-hidden className="hero-glow animate-[drift-light_14s_ease-in-out_infinite]" />
      <MarketingRings className="hero-rings select-none opacity-75" />
      <div
        className={`relative z-[1] flex max-w-md flex-col items-center gap-5 transition-opacity duration-300 ${
          awaitingConfirm ? 'opacity-35' : 'animate-[rise-in_0.9s_var(--ease-out)_both]'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function BootLoading({ awaitingConfirm }: { awaitingConfirm: boolean }) {
  return (
    <BootShell busy awaitingConfirm={awaitingConfirm}>
      <TrousseauMark className="h-16 w-auto opacity-95" />
      <div className="flex flex-col items-center gap-3">
        <p className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,3.5rem)] leading-none tracking-[-0.03em] text-[var(--on-dark)]">
          Trousseau
        </p>
        <p className="text-[11px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
          {awaitingConfirm ? 'Ready when you are' : 'Opening your budget'}
        </p>
      </div>
      {!awaitingConfirm ? (
        <div
          aria-hidden
          className="mt-1 h-px w-28 origin-center bg-[var(--accent)] animate-[boot-bar_1.6s_ease-in-out_infinite]"
        />
      ) : null}
    </BootShell>
  )
}

export function BootError({ message }: { message: string }) {
  return (
    <BootShell>
      <TrousseauMark className="h-14 w-auto opacity-90" />
      <div className="flex flex-col items-center gap-3">
        <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,2.75rem)] leading-none tracking-[-0.03em] text-[var(--on-dark)]">
          Couldn’t reach your budget
        </p>
        <p className="text-sm leading-6 text-[var(--on-dark-muted)]">{message}</p>
      </div>
      <button type="button" className="btn-nav mt-1" onClick={() => window.location.reload()}>
        Try again
      </button>
    </BootShell>
  )
}
