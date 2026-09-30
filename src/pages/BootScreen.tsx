import { useState, type ReactNode } from 'react'
import { MarketingArt, type MarketingArtKind } from '../components/marketing/MarketingArt'

const BOOT_ARTS: MarketingArtKind[] = [
  'key',
  'chest',
  'envelope',
  'archive',
  'calendar',
  'nameplate',
]

function pickBootArt(): MarketingArtKind {
  return BOOT_ARTS[Math.floor(Math.random() * BOOT_ARTS.length)]!
}

function BootShell({
  children,
  busy = false,
}: {
  children: ReactNode
  busy?: boolean
}) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--grove)] page-pad text-center"
      role={busy ? 'status' : undefined}
      aria-busy={busy ? true : undefined}
      aria-live={busy ? 'polite' : undefined}
    >
      <div
        aria-hidden
        className="hero-glow hero-glow-boot animate-[drift-light_14s_ease-in-out_infinite]"
      />
      <div className="relative z-[1] flex w-full max-w-[26rem] flex-col items-center gap-5 animate-[rise-in_0.9s_var(--ease-out)_both] sm:gap-[1.375rem]">
        {children}
      </div>
    </div>
  )
}

function BootArt({ kind, dimmed = false }: { kind: MarketingArtKind; dimmed?: boolean }) {
  return (
    <div
      aria-hidden
      className={`boot-key w-[11.25rem] sm:w-[15rem] ${dimmed ? 'opacity-55' : ''}`.trim()}
    >
      <MarketingArt kind={kind} motion={!dimmed} className="aspect-[720/600] w-full" />
    </div>
  )
}

export function BootLoading() {
  const [art] = useState(pickBootArt)

  return (
    <BootShell busy>
      <BootArt kind={art} />
      <div className="flex flex-col items-center gap-3 sm:gap-3.5">
        <p className="font-[family-name:var(--font-display)] text-[clamp(3rem,10vw,4.25rem)] leading-[0.9] tracking-[-0.03em] text-[var(--on-dark)]">
          Trousseau
        </p>
        <p className="text-[11px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
          Opening your budget
        </p>
      </div>
      <div aria-hidden className="boot-progress">
        <div className="boot-progress-fill" />
      </div>
    </BootShell>
  )
}

export function BootError({ message }: { message: string }) {
  return (
    <BootShell>
      <BootArt kind="key" dimmed />
      <div className="flex flex-col items-center gap-3.5">
        <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.05] tracking-[-0.03em] text-[var(--on-dark)]">
          Couldn’t reach your budget
        </p>
        <p className="max-w-[22.5rem] text-[15px] leading-6 text-[color-mix(in_srgb,var(--on-dark)_62%,transparent)]">
          {message || 'Check your connection, then try again. Your share link is unchanged.'}
        </p>
      </div>
      <button type="button" className="btn-primary mt-1" onClick={() => window.location.reload()}>
        Try again
      </button>
    </BootShell>
  )
}
