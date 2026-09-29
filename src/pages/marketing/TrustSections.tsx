import { Link } from 'react-router-dom'
import { faqs } from './content'

export function PrivacySection() {
  return (
    <section id="privacy" className="scroll-mt-8 bg-[var(--grove)] page-pad py-24 text-[var(--on-dark)]">
      <div className="page-shell flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between sm:gap-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--accent)] uppercase">
            Shared by design
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3rem)] leading-[1.08] tracking-[-0.02em]">
            One secret link for both of you
          </h2>
          <p className="mt-4 text-[var(--on-dark-muted)]">
            Trousseau syncs gifts, receipts, and notes through a private share URL — no account to
            create. Treat the link like a password, and export a zip when you want an offline copy.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,2.5rem)] tracking-tight">
            Link is the key
          </p>
          <p className="mt-2 text-sm tracking-wide text-[var(--on-dark-muted)]">
            No signup · Cloud sync
          </p>
        </div>
      </div>
    </section>
  )
}

export function BackupSection() {
  return (
    <section id="backup" className="scroll-mt-8 bg-[var(--paper)] page-pad py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
          Backup
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Take it with you
        </h2>
        <p className="mt-4 max-w-lg text-[var(--ink-muted)]">
          Your live budget stays on the share link. Download a zip whenever you want a durable archive,
          or import a zip to start a new shared budget from a backup or sample.
        </p>
        <div className="mt-14 flex flex-col gap-8 border-t border-[var(--line-soft)] pt-10 sm:flex-row sm:items-baseline sm:justify-between sm:gap-12">
          <p className="max-w-sm font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight text-[var(--ink)]">
            Copy the share link for your partner. Export a zip for yourself.
          </p>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link
              to="/app"
              className="shrink-0 text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
            >
              Open tracker
            </Link>
            <a
              href="/samples/sample-wedding.zip"
              download="sample-wedding.zip"
              className="shrink-0 text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
            >
              Download sample wedding
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function QuestionsSection() {
  return (
    <section id="questions" className="scroll-mt-8 bg-[var(--mist)] page-pad py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
          Questions
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          A few plain answers
        </h2>
        <ul className="mt-16">
          {faqs.map((item, i) => (
            <li
              key={item.q}
              className={`grid gap-3 py-10 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-12 ${
                i < faqs.length - 1 ? 'border-b border-[var(--line-soft)]' : ''
              }`}
            >
              <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight sm:text-2xl">
                {item.q}
              </h3>
              <p className="max-w-xl leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function BeginSection() {
  return (
    <section className="bg-[var(--paper-deep)] page-pad py-24">
      <div className="page-shell">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
            Begin
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            Put your names on the page
          </h2>
          <p className="mt-4 text-[var(--ink-muted)]">
            Start a blank tracker and get a share link for both of you, or peek at a filled demo first.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link to="/app?new=1" className="btn-primary">
              Start your tracker
            </Link>
            <Link
              to="/app?demo=1"
              className="text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
            >
              Try a filled demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
