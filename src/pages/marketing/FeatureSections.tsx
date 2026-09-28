import { SketchBouquet } from '../../components/sketches'
import { customs, features, steps, tracks } from './content'

export function WhySection() {
  return (
    <section className="bg-[var(--wash)] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[var(--max)]">
        <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          Why Trousseau
        </p>
        <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Built for the couple keeping score, not the spreadsheet
        </h2>
        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-12">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--ink-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function InsideSection() {
  return (
    <section className="bg-[var(--grove)] px-6 py-24 text-[var(--on-dark)] sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[var(--max)]">
        <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
          Inside the tracker
        </p>
        <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Everything you need on one quiet page
        </h2>
        <ul className="mt-16">
          {tracks.map((t, i) => (
            <li
              key={t.label}
              className={`flex flex-col gap-3 py-10 sm:flex-row sm:items-baseline sm:gap-16 ${
                i < tracks.length - 1
                  ? 'border-b border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)]'
                  : ''
              }`}
            >
              <h3 className="w-full max-w-[14rem] shrink-0 font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-[1.65rem]">
                {t.label}
              </h3>
              <p className="max-w-xl leading-relaxed text-[var(--on-dark-muted)]">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function HowSection() {
  return (
    <section className="relative bg-[var(--paper)]">
      <div className="relative mx-auto w-full max-w-[var(--max)] px-6 py-24 sm:px-10 lg:px-16">
        <SketchBouquet
          aria-hidden
          className="pointer-events-none absolute top-16 right-4 w-28 text-[var(--lichen)] opacity-45 select-none sm:right-10 sm:w-36"
        />
        <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          How it works
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Three quiet steps
        </h2>
        <ol className="mt-16 space-y-0">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className={`flex flex-col gap-2 py-12 sm:flex-row sm:items-baseline sm:gap-10 ${
                i < steps.length - 1 ? 'border-b border-[var(--line-soft)]' : ''
              }`}
            >
              <span className="w-[4.5rem] shrink-0 font-[family-name:var(--font-display)] text-3xl text-[var(--accent-deep)] tabular-nums">
                {s.n}
              </span>
              <div>
                <h3 className="text-xl font-medium tracking-tight">{s.title}</h3>
                <p className="mt-2 max-w-lg text-[var(--ink-muted)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function YoursSection() {
  return (
    <section className="bg-[var(--wash)] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[var(--max)]">
        <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
          Make it yours
        </p>
        <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Click anything that looks like a label
        </h2>
        <p className="mt-4 max-w-lg text-[var(--ink-muted)]">
          Trousseau is meant to be rewritten. Titles, categories, and notes stay soft under your cursor.
        </p>
        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {customs.map((c) => (
            <div key={c.title} className="border-t border-[var(--line-soft)] pt-6">
              <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{c.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--ink-muted)]">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
