import type { ComponentType, SVGProps } from 'react'
import { MarketingArt } from '../../components/marketing/MarketingArt'
import { MarketingChest } from '../../components/marketing/MarketingChest'
import { SketchEnvelope, SketchHeart, SketchPencil } from '../../components/sketches'
import { calendarStory, customs, features, nameStory, steps, tracks } from './content'

type Sketch = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>

const yoursSketches: Sketch[] = [SketchHeart, SketchPencil, SketchEnvelope]

export function NameSection() {
  return (
    <section
      id="name"
      className="scroll-mt-24 overflow-x-clip bg-[var(--paper)] page-pad py-16 sm:py-20 lg:py-24"
    >
      <div className="page-shell flex flex-col items-center gap-10 sm:gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex min-w-0 w-full max-w-[720px] flex-1 flex-col gap-7 sm:gap-9">
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
              {nameStory.eyebrow}
            </p>
            <h2 className="max-w-[480px] text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
              {nameStory.title}
            </h2>
            <div className="h-px w-12 bg-[var(--accent)]" aria-hidden />
          </div>
          <div className="flex max-w-[560px] flex-col gap-4">
            <p className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.5vw,1.5rem)] leading-[1.4] tracking-[-0.015em] text-[var(--ink)]">
              {nameStory.lead}
            </p>
            <p className="leading-relaxed text-[var(--ink-muted)]">{nameStory.body}</p>
          </div>
        </div>
        <figure className="section-art w-full max-w-[240px] shrink sm:max-w-[280px] lg:max-w-[360px]">
          <MarketingChest className="select-none" />
        </figure>
      </div>
    </section>
  )
}

export function WhySection() {
  return (
    <section className="bg-[var(--mist)] page-pad py-16 sm:py-20 lg:py-24">
      <div className="page-shell flex flex-col gap-10 sm:gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
        <div className="flex max-w-[480px] flex-col gap-5 lg:shrink-0">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
            Why this tracker
          </p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] tracking-[-0.02em]">
            Built for the couple keeping score, not the spreadsheet
          </h2>
          <div className="h-px w-12 bg-[var(--accent)]" aria-hidden />
        </div>
        <ul className="flex w-full max-w-[640px] flex-col">
          {features.map((f, i) => (
            <li
              key={f.title}
              className={`flex flex-col gap-2.5 py-6 sm:py-7 ${
                i < features.length - 1 ? 'border-b border-[var(--line-soft)]' : ''
              }`}
            >
              <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.5vw,1.75rem)] leading-[1.15] tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="max-w-[520px] text-base leading-[26px] text-[var(--ink-muted)]">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function InsideSection() {
  return (
    <section className="bg-[var(--grove)] page-pad py-16 text-[var(--on-dark)] sm:py-20 lg:py-24">
      <div className="page-shell">
        <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--accent)] uppercase">
          Inside the tracker
        </p>
        <h2 className="mt-3 max-w-2xl text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          Everything you need on one quiet page
        </h2>
        <ul className="mt-10 sm:mt-16">
          {tracks.map((t, i) => (
            <li
              key={t.label}
              className={`flex flex-col gap-3 py-8 sm:flex-row sm:items-baseline sm:gap-16 sm:py-10 ${
                i < tracks.length - 1
                  ? 'border-b border-[color-mix(in_srgb,var(--on-dark)_12%,transparent)]'
                  : ''
              }`}
            >
              <h3 className="w-full max-w-[14rem] shrink-0 font-[family-name:var(--font-display)] text-[clamp(1.35rem,3vw,1.65rem)] tracking-tight">
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

export function CalendarSection() {
  return (
    <section
      id="due"
      className="scroll-mt-24 overflow-x-clip bg-[var(--paper-deep)] page-pad py-16 sm:py-20 lg:py-24"
    >
      <div className="page-shell flex flex-col items-start gap-10 sm:gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
            {calendarStory.eyebrow}
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            {calendarStory.title}
          </h2>
          <p className="mt-4 max-w-lg text-[var(--ink-muted)]">{calendarStory.body}</p>
        </div>
        <aside className="flex w-full max-w-[280px] flex-col items-start gap-4 self-center sm:self-start lg:items-end lg:self-auto">
          <figure className="section-art w-full max-w-[220px] sm:max-w-[260px]">
            <MarketingArt kind="calendar" className="select-none" delay="-1.2s" />
          </figure>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="h-px w-12 bg-[var(--accent)]" aria-hidden />
            <p className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.5vw,1.75rem)] leading-snug tracking-tight text-[var(--accent-deep)] lg:text-right">
              Calendar and agenda, side by side
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export function HowSection() {
  return (
    <section
      id="how"
      className="scroll-mt-24 overflow-x-clip bg-[var(--paper)] page-pad py-16 sm:py-20 lg:py-24"
    >
      <div className="page-shell">
        <div className="flex flex-col items-start justify-between gap-8 sm:gap-10 lg:flex-row lg:items-center">
          <div className="max-w-[420px]">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase">
              How it works
            </p>
            <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
              Three quiet steps
            </h2>
          </div>
          <figure className="section-art w-full max-w-[180px] shrink-0 self-center sm:max-w-[220px] lg:self-auto">
            <MarketingArt kind="envelope" className="select-none" delay="-2.4s" />
          </figure>
        </div>
        <ol className="mt-10 grid gap-10 sm:mt-16 sm:gap-12 md:grid-cols-3 md:gap-8 lg:gap-10">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col gap-3 sm:gap-4">
              <span className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,4rem)] leading-none text-[var(--accent)] tabular-nums">
                {s.n}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="text-[15px] leading-6 text-[var(--ink-muted)]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function YoursSection() {
  return (
    <section className="bg-[var(--mist)] page-pad py-16 sm:py-20 lg:py-24">
      <div className="page-shell flex flex-col gap-10 sm:gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
        <div className="flex max-w-[440px] flex-col gap-5 lg:shrink-0">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--lichen)] uppercase">
            Make it yours
          </p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] tracking-[-0.02em]">
            Rewrite the page until it feels like your wedding
          </h2>
          <div className="h-px w-12 bg-[var(--accent)]" aria-hidden />
          <p className="max-w-[380px] text-[var(--ink-muted)]">
            Titles, categories, and notes stay soft under your cursor. Click anything that looks like a
            label.
          </p>
        </div>
        <ul className="flex w-full max-w-[680px] flex-col">
          {customs.map((c, i) => {
            const Sketch = yoursSketches[i] ?? SketchPencil
            return (
              <li
                key={c.title}
                className={`flex flex-row items-start gap-4 py-6 sm:gap-6 sm:py-7 ${
                  i < customs.length - 1 ? 'border-b border-[var(--line-soft)]' : ''
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11">
                  <Sketch aria-hidden className="h-9 w-9 text-[var(--accent-deep)] sm:h-10 sm:w-10" />
                </div>
                <div className="flex min-w-0 flex-col gap-2.5">
                  <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.5vw,1.75rem)] leading-[1.15] tracking-[-0.01em]">
                    {c.title}
                  </h3>
                  <p className="max-w-[480px] leading-relaxed text-[var(--ink-muted)]">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
