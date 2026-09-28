import { Link } from 'react-router-dom'
import { faqs } from './content'

export function PrivacySection() {
  return (
    <section className="bg-[var(--grove)] page-pad py-24 text-[var(--on-dark)]">
      <div className="page-shell flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between sm:gap-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--accent)] uppercase">
            Private by design
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3rem)] leading-[1.08] tracking-[-0.02em]">
            Your budget never leaves this browser
          </h2>
          <p className="mt-4 text-[var(--on-dark-muted)]">
            Trousseau stores gifts, receipts, and notes on your device. Export a zip when you want a
            backup. There is no account to create.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,2.5rem)] tracking-tight">
            Local-first
          </p>
          <p className="mt-2 text-sm tracking-wide text-[var(--on-dark-muted)]">
            No cloud ledger · No signup
          </p>
        </div>
      </div>
    </section>
  )
}

export function BackupSection() {
  return (
    <section className="bg-[var(--paper)] page-pad py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
          Backup
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Take it with you
        </h2>
        <p className="mt-4 max-w-lg text-[var(--ink-muted)]">
          Download a zip of your budget and attachments whenever you switch machines or want a durable
          copy. Import brings everything back.
        </p>
        <div className="mt-14 flex flex-col gap-8 border-t border-[var(--line-soft)] pt-10 sm:flex-row sm:items-baseline sm:justify-between sm:gap-12">
          <p className="max-w-sm font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight text-[var(--ink)]">
            Export before you clear history. Import when you land somewhere new.
          </p>
          <Link
            to="/app"
            className="shrink-0 text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
          >
            Open tracker to export
          </Link>
        </div>
      </div>
    </section>
  )
}

export function QuestionsSection() {
  return (
    <section className="bg-[var(--mist)] page-pad py-24">
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
            Start empty and shape the budget as you go, or peek at a filled demo first.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link to="/app" className="btn-primary">
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
