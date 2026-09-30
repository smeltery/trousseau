import { useEffect, useRef, useState } from 'react'
import type { Attachment, Category, LineItem } from '../db/types'
import { GROUP_ORDER, groupCategories } from '../lib/budget'
import { isOverdue, todayKey } from '../lib/calendar'
import { expensesRunningTotal } from '../lib/expense-display'
import { sectionScrollMt } from '../lib/ux/scroll-mt'
import { readHidePaid, writeHidePaid } from '../lib/ux/hide-paid'
import { isDueSoon } from '../lib/ux/reimburse-aging'
import { isReimbursementAging } from '../lib/ux/reimburse-aging'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { applyGuestCountToPlateLines } from '../lib/ux/guest-plate'
import { showToast } from '../lib/toast'
import { EditableText } from './EditableText'
import { ExpenseGroupBlock } from './ExpenseGroupBlock'
import { ExpenseBulkBar } from './expenses/ExpenseBulkBar'
import {
  ExpenseFilterBar,
  type ExpenseFilter,
  type WhoPaysFilter,
} from './expenses/ExpenseFilterBar'
import { SettlingMoney } from './SettlingMoney'

interface ExpenseGroupsProps {
  site: SiteSettings
  categories: Category[]
  lineItems: LineItem[]
  attachments: Attachment[]
  allocated: number
  syncBanner?: boolean
  onOpenItem: (id: string) => void
  onAddExpense: () => void
}

export function ExpenseGroups({
  site,
  categories,
  lineItems,
  attachments,
  allocated,
  syncBanner = false,
  onOpenItem,
  onAddExpense,
}: ExpenseGroupsProps) {
  const today = todayKey()
  const [filter, setFilter] = useState<ExpenseFilter>('all')
  const [whoFilter, setWhoFilter] = useState<WhoPaysFilter>('all')
  const [query, setQuery] = useState('')
  const [hidePaid, setHidePaid] = useState(readHidePaid)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDue, setBulkDue] = useState('')
  const runningTotal = expensesRunningTotal(categories, lineItems)
  const moneyLeft = allocated - runningTotal
  const over = moneyLeft < 0
  const seenIds = useRef(new Set(lineItems.map((i) => i.id)))
  const [enteringIds, setEnteringIds] = useState<Set<string>>(() => new Set())
  const selectMode =
    filter === 'unpaid' ||
    filter === 'overdue' ||
    filter === 'dueSoon' ||
    filter === 'undated' ||
    filter === 'reimburse' ||
    whoFilter !== 'all'
  const q = query.trim().toLowerCase()

  const visibleItems = lineItems.filter((item) => {
    if (filter === 'all' && hidePaid) {
      if (item.status === 'paid' && !/^budget$/i.test(item.label.trim())) return false
    } else if (filter === 'unpaid') {
      if (item.status === 'paid') return false
    } else if (filter === 'overdue') {
      if (!isOverdue(item, today)) return false
    } else if (filter === 'dueSoon') {
      if (!isDueSoon(item, today, 14)) return false
    } else if (filter === 'undated') {
      if (item.status === 'paid' || item.dueDate || /^budget$/i.test(item.label.trim())) return false
    } else if (filter === 'reimburse') {
      if (!isReimbursementAging(item, categories, today)) return false
    }
    if (whoFilter === 'unset') {
      if (item.whoPays) return false
    } else if (whoFilter !== 'all') {
      if (item.whoPays !== whoFilter) return false
    }
    if (!q) return true
    const cat = categories.find((c) => c.id === item.categoryId)?.name ?? ''
    const hay = `${item.label} ${item.notes ?? ''} ${cat} ${item.vendorUrl ?? ''}`.toLowerCase()
    return hay.includes(q)
  })
  const filterEmpty =
    (filter !== 'all' || whoFilter !== 'all' || q.length > 0 || hidePaid) && visibleItems.length === 0

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, whoFilter, query])

  useEffect(() => {
    const fresh = new Set<string>()
    for (const item of lineItems) {
      if (!seenIds.current.has(item.id)) {
        fresh.add(item.id)
        seenIds.current.add(item.id)
      }
    }
    if (!fresh.size) return
    setEnteringIds(fresh)
    const t = window.setTimeout(() => setEnteringIds(new Set()), 450)
    return () => window.clearTimeout(t)
  }, [lineItems])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedItems = visibleItems.filter((i) => selectedIds.has(i.id))

  return (
    <section
      id="expenses"
      className={`relative ${sectionScrollMt(syncBanner)} overflow-x-clip border-t border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--grove)_4%,transparent)] page-pad py-24`}
    >
      <div className="page-shell">
        <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-[560px] flex-1">
            <EditableText
              aria-label="Expenses section eyebrow"
              value={site.expensesEyebrow}
              onSave={(expensesEyebrow) => patchSiteSettings({ expensesEyebrow })}
              className="w-full text-[11px] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase"
            />
            <EditableText
              aria-label="Expenses section title"
              value={site.expensesTitle}
              onSave={(expensesTitle) => patchSiteSettings({ expensesTitle })}
              className="mt-4 w-full font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]"
            />
            <EditableText
              aria-label="Expenses section description"
              value={site.expensesSub}
              onSave={(expensesSub) => patchSiteSettings({ expensesSub })}
              multiline
              className="mt-4 w-full text-base leading-[26px] text-[var(--ink-muted)]"
            />
            <label className="mt-4 inline-flex flex-wrap items-center gap-2 text-sm text-[var(--ink-muted)]">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-faint)]">
                Guests
              </span>
              <input
                inputMode="numeric"
                aria-label="Guest headcount"
                defaultValue={site.guestCount ?? ''}
                key={site.guestCount ?? 'guests'}
                className="field-input w-20 py-1.5 text-sm"
                placeholder="0"
                onBlur={(e) => {
                  const raw = e.target.value.trim()
                  const n = raw ? Number.parseInt(raw, 10) : undefined
                  const guestCount = n != null && n > 0 ? n : undefined
                  void (async () => {
                    await patchSiteSettings({ guestCount })
                    if (guestCount) {
                      const updated = await applyGuestCountToPlateLines(guestCount)
                      if (updated > 0) showToast(`Updated ${updated} plate line${updated === 1 ? '' : 's'}`)
                    }
                  })()
                }}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={onAddExpense}
            className="self-start text-sm font-semibold tracking-[0.04em] text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
          >
            Add expense
          </button>
        </div>

        <ExpenseFilterBar
          site={site}
          filter={filter}
          whoFilter={whoFilter}
          query={query}
          hidePaid={hidePaid}
          onFilter={setFilter}
          onWhoFilter={setWhoFilter}
          onQuery={setQuery}
          onHidePaid={(next) => {
            setHidePaid(next)
            writeHidePaid(next)
          }}
        />

        {selectMode ? (
          <ExpenseBulkBar
            selectedItems={selectedItems}
            categories={categories}
            bulkDue={bulkDue}
            onBulkDueChange={setBulkDue}
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
                setWhoFilter('all')
                setQuery('')
                setHidePaid(false)
                writeHidePaid(false)
              }}
              className="mt-5 text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {GROUP_ORDER.map((group) => (
              <ExpenseGroupBlock
                key={group}
                group={group}
                groupLabel={site.groupLabels[group]}
                onRenameGroup={(label) =>
                  patchSiteSettings({
                    groupLabels: { ...site.groupLabels, [group]: label },
                  })
                }
                cats={groupCategories(categories, group)}
                lineItems={visibleItems}
                allLineItems={lineItems}
                attachments={attachments}
                enteringIds={enteringIds}
                filterActive={filter !== 'all' || whoFilter !== 'all' || q.length > 0 || hidePaid}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onOpenItem={onOpenItem}
              />
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-col gap-8 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase">
              Running total
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[40px] leading-12 tracking-[-0.02em]">
              <SettlingMoney value={runningTotal} />
            </p>
          </div>
          <div className="sm:text-right">
            <p
              className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${over ? 'text-[var(--danger)]' : 'text-[var(--lichen)]'}`}
            >
              {over ? 'Over budget' : 'Money left'}
            </p>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-[40px] leading-12 tracking-[-0.02em] ${over ? 'text-[var(--danger)]' : ''}`}
            >
              <SettlingMoney value={Math.abs(moneyLeft)} className={over ? 'over-nudge' : ''} />
            </p>
            {over ? (
              <a
                href="#gift-summary"
                className="mt-3 inline-block text-sm font-semibold tracking-[0.04em] text-[var(--accent-deep)] underline underline-offset-6 hover:text-[var(--ink)]"
              >
                Add funds
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
