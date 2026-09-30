import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Category, Fund, LineItem } from '../../db/types'
import { patchSiteSettings, type SiteSettings } from '../../lib/site-settings'
import { sectionScrollMt } from '../../lib/ux/scroll-mt'
import { formatMoney, sum } from '../../lib/money'
import { giftPromiseRollup, isGiftPromised, isGiftReceived } from '../../lib/ux/who-pays-rollup'
import { liquidCash } from '../../lib/ux/fund-drawdown'
import { EditableText } from '../EditableText'
import { SettlingMoney } from '../SettlingMoney'
import { FundGroup } from './FundGroup'
import { GiftBulkBar } from './GiftBulkBar'
import { SavingsPlanCard } from './SavingsPlanCard'

type GiftFilter = 'all' | 'unthanked' | 'promised' | 'received'

const FILTERS: { id: GiftFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'promised', label: 'Promised' },
  { id: 'received', label: 'Received' },
  { id: 'unthanked', label: 'Unthanked' },
]

interface FundsSectionProps {
  site: SiteSettings
  funds: Fund[]
  categories?: Category[]
  lineItems?: LineItem[]
  syncBanner?: boolean
}

export function FundsSection({
  site,
  funds,
  categories: categoriesProp,
  lineItems: lineItemsProp,
  syncBanner = false,
}: FundsSectionProps) {
  const liveCategories =
    useLiveQuery(() => db.categories.orderBy('sort').toArray(), []) ?? ([] as Category[])
  const liveItems =
    useLiveQuery(() => db.lineItems.toArray(), []) ?? ([] as LineItem[])
  const categories = categoriesProp ?? liveCategories
  const lineItems = lineItemsProp ?? liveItems

  const [filter, setFilter] = useState<GiftFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const selectMode = filter === 'unthanked'
  const q = query.trim().toLowerCase()
  const promise = giftPromiseRollup(funds)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, query])

  function matchesSearch(f: Fund) {
    if (!q) return true
    return `${f.label} ${f.source ?? ''}`.toLowerCase().includes(q)
  }

  const gifts = funds
    .filter((f) => f.type === 'gift')
    .filter((f) => {
      if (filter === 'unthanked') return !f.thanked
      if (filter === 'promised') return isGiftPromised(f)
      if (filter === 'received') return isGiftReceived(f)
      return true
    })
    .filter(matchesSearch)
    .sort((a, b) => a.sort - b.sort)
  const savings = funds
    .filter((f) => f.type === 'savings')
    .filter(matchesSearch)
    .sort((a, b) => a.sort - b.sort)
  const allocated = sum(funds.map((f) => f.amount))
  const liquid = liquidCash(funds, lineItems)
  const filterEmpty =
    (filter !== 'all' || q.length > 0) && gifts.length === 0 && savings.length === 0

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedFunds = gifts.filter((f) => selectedIds.has(f.id))

  return (
    <section
      id="gift-summary"
      className={`${sectionScrollMt(syncBanner)} overflow-x-clip bg-[var(--mist)] page-pad py-24`}
    >
      <div className="page-shell">
        <div className="max-w-[560px]">
          <EditableText
            aria-label="Funds section eyebrow"
            value={site.fundsEyebrow}
            onSave={(fundsEyebrow) => patchSiteSettings({ fundsEyebrow })}
            className="w-full text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase"
          />
          <EditableText
            aria-label="Funds section title"
            value={site.fundsTitle}
            onSave={(fundsTitle) => patchSiteSettings({ fundsTitle })}
            className="mt-4 w-full font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]"
          />
          <EditableText
            aria-label="Funds section description"
            value={site.fundsSub}
            onSave={(fundsSub) => patchSiteSettings({ fundsSub })}
            multiline
            className="mt-4 w-full text-base leading-[26px] text-[var(--ink-muted)]"
          />
        </div>

        {(promise.promisedCount > 0 || promise.receivedCount > 0) && filter === 'all' && !q ? (
          <p className="mt-6 text-sm tabular-nums text-[var(--ink-muted)]">
            {promise.promisedCount > 0 ? (
              <>
                <span className="font-semibold text-[var(--accent-deep)]">Promised · </span>
                {formatMoney(promise.promised)}
              </>
            ) : null}
            {promise.promisedCount > 0 && promise.receivedCount > 0 ? (
              <span className="text-[var(--ink-faint)]"> · </span>
            ) : null}
            {promise.receivedCount > 0 ? (
              <>
                <span className="font-semibold text-[var(--accent-deep)]">Received · </span>
                {formatMoney(promise.received)}
              </>
            ) : null}
          </p>
        ) : null}

        <div className="mt-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Gift filter"
            className="inline-flex flex-wrap border border-[var(--line-soft)] bg-[var(--paper)]"
            onKeyDown={(e) => {
              const i = FILTERS.findIndex((f) => f.id === filter)
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault()
                const next =
                  e.key === 'ArrowRight'
                    ? FILTERS[(i + 1) % FILTERS.length]!
                    : FILTERS[(i - 1 + FILTERS.length) % FILTERS.length]!
                setFilter(next.id)
              }
            }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                tabIndex={filter === f.id ? 0 : -1}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-[var(--grove)] text-[var(--on-dark)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="relative block min-w-0 sm:w-64">
            <span className="sr-only">Search gifts</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gift or source…"
              className="field-input w-full py-2 text-sm"
            />
          </label>
        </div>

        {selectMode ? (
          <GiftBulkBar
            selectedFunds={selectedFunds}
            onClear={() => setSelectedIds(new Set())}
          />
        ) : null}

        {filterEmpty ? (
          <div className="rounded-sm border border-[var(--line-soft)] bg-[var(--paper)] px-6 py-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em]">
              Nothing matches
            </p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">Try another filter or clear search.</p>
            <button
              type="button"
              onClick={() => {
                setFilter('all')
                setQuery('')
              }}
              className="mt-5 text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-14 lg:flex-row lg:gap-20">
            <FundGroup
              title={site.giftColumn}
              onRenameTitle={(giftColumn) => patchSiteSettings({ giftColumn })}
              type="gift"
              funds={gifts}
              categories={categories}
              lineItems={lineItems}
              emptyLabel="No gifts yet"
              emptyWhy="Cash gifts and checks that fund the day."
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
            <FundGroup
              title={site.savingsColumn}
              onRenameTitle={(savingsColumn) => patchSiteSettings({ savingsColumn })}
              type="savings"
              funds={savings}
              lineItems={lineItems}
              emptyLabel="No savings yet"
              emptyWhy="What you’ve set aside together for the wedding."
            />
          </div>
        )}

        <SavingsPlanCard site={site} funds={funds} />

        <div className="mt-14 flex flex-col gap-2 pt-2">
          <div className="flex items-baseline justify-between gap-6">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
              Total allocated
            </p>
            <p className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.25rem)] tracking-[-0.02em]">
              <SettlingMoney value={allocated} />
            </p>
          </div>
          {liquid.drawn > 0 || liquid.promisedExcluded > 0 ? (
            <p className="text-sm tabular-nums text-[var(--ink-muted)]">
              {formatMoney(liquid.liquid)} liquid
              {liquid.drawn > 0 ? ` · ${formatMoney(liquid.drawn)} drawn` : ''}
              {liquid.promisedExcluded > 0
                ? ` · ${formatMoney(liquid.promisedExcluded)} promised excluded`
                : ''}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
