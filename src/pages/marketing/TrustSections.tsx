import { Link } from 'react-router-dom'
import { MarketingArt } from '../../components/marketing/MarketingArt'
import { faqs } from './content'

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="scroll-mt-24 overflow-x-clip bg-[var(--grove)] page-pad py-16 text-[var(--on-dark)] sm:py-20 lg:py-28"
    >
      <div className="page-shell flex flex-col items-center text-center">
        <figure className="section-art mb-6 w-full max-w-[180px] sm:mb-8 sm:max-w-[220px]">
          <MarketingArt kind="key" className="select-none" delay="-0.8s" />
        </figure>
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--accent)] uppercase">
          Shared by design
        </p>
        <h2 className="mt-4 max-w-2xl text-balance font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          One secret link for both of you
        </h2>
        <div className="mx-auto mt-6 h-px w-12 bg-[var(--accent)]" aria-hidden />
        <p className="mt-7 max-w-lg text-[16px] leading-7 text-[var(--on-dark-muted)] sm:text-[17px]">
          Trousseau syncs gifts, receipts, and notes through a private share URL, with no account to
          create. Treat the link like a password, and export a zip when you want an offline copy.
        </p>
        <ul className="mt-8 flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] tracking-[0.08em] text-[var(--accent)] uppercase sm:text-[13px]">
          <li>Link is the key</li>
          <li aria-hidden className="text-[var(--accent)]/40">
            ·
          </li>
          <li>No signup</li>
          <li aria-hidden className="text-[var(--accent)]/40">
            ·
          </li>
          <li>Cloud sync</li>
        </ul>
      </div>
    </section>
  )
}

export function BackupSection() {
  return (
    <section
      id="backup"
      className="scroll-mt-24 overflow-x-clip bg-[var(--paper)] page-pad py-16 sm:py-20 lg:py-24"
    >
      <div className="page-shell">
        <div className="flex flex-col items-start gap-10 sm:gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
              Backup
            </p>
            <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
              Take it with you
            </h2>
            <p className="mt-4 max-w-lg text-[var(--ink-muted)]">
              Your live budget stays on the share link. Download a zip whenever you want a durable
              archive, or import a zip to start a new shared budget from a backup or sample.
            </p>
          </div>
          <figure className="section-art w-full max-w-[220px] shrink-0 self-center sm:max-w-[280px] sm:self-start lg:self-auto">
            <MarketingArt kind="archive" className="select-none" delay="-1.8s" />
          </figure>
        </div>
        <div className="mt-10 flex flex-col gap-8 border-t border-[var(--line-soft)] pt-8 sm:mt-14 sm:flex-row sm:items-baseline sm:justify-between sm:gap-12 sm:pt-10">
          <p className="max-w-sm font-[family-name:var(--font-display)] text-[clamp(1.35rem,3vw,1.5rem)] leading-snug tracking-tight text-[var(--ink)]">
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
    <section id="questions" className="scroll-mt-24 bg-[var(--mist)] page-pad py-16 sm:py-20 lg:py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
          Questions
        </p>
        <h2 className="mt-3 max-w-xl text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          A few plain answers
        </h2>
        <ul className="mt-10 sm:mt-16">
          {faqs.map((item) => (
            <li
              key={item.q}
              className="flex flex-col gap-3 border-t border-[var(--line-soft)] py-8 sm:flex-row sm:gap-12 sm:py-10"
            >
              <h3 className="w-full max-w-[20rem] shrink-0 font-[family-name:var(--font-display)] text-[clamp(1.25rem,3vw,1.5rem)] tracking-tight">
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
    <section className="overflow-x-clip bg-[var(--paper-deep)]">
      <div className="grid lg:min-h-[32rem] lg:grid-cols-2">
        <div className="flex items-center justify-start px-[var(--page-pad)] py-16 sm:px-[var(--page-pad-md)] sm:py-20 lg:justify-end lg:px-[var(--page-pad-lg)] lg:py-24 lg:pr-12">
          <div className="flex w-full max-w-[440px] flex-col items-start gap-5 sm:gap-6">
            <figure className="section-art w-full max-w-[140px] sm:max-w-[168px]">
              <MarketingArt kind="nameplate" className="select-none" delay="-3s" />
            </figure>
            <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
              Begin
            </p>
            <h2 className="text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3rem)] leading-[1.05] tracking-[-0.02em]">
              Put your names on the page
            </h2>
            <p className="max-w-[400px] text-[var(--ink-muted)]">
              Start a blank tracker and get a share link for both of you, or peek at a filled demo first.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-start bg-[var(--grove)] px-[var(--page-pad)] py-16 text-[var(--on-dark)] sm:px-[var(--page-pad-md)] sm:py-20 lg:px-[var(--page-pad-lg)] lg:py-24 lg:pl-12">
          <div className="flex w-full max-w-[440px] flex-col items-start gap-6 sm:gap-8">
            <p className="text-balance font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,1.75rem)] leading-snug tracking-[-0.01em]">
              A blank page and a share link. That is all it takes to start.
            </p>
            <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:items-start">
              <Link to="/app?new=1" className="btn-primary w-full sm:w-auto">
                Start your tracker
              </Link>
              <Link
                to="/app?demo=1"
                className="text-sm font-semibold tracking-wide text-[var(--accent)] underline decoration-1 underline-offset-6 hover:text-[var(--on-dark)]"
              >
                Try a filled demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
