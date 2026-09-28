import { useEffect, useRef, useState } from 'react'
import type { Attachment, Category, LineItem } from '../db/types'
import { GROUP_ORDER, groupCategories } from '../lib/budget'
import { expensesRunningTotal } from '../lib/expense-display'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { EditableText } from './EditableText'
import { ExpenseGroupBlock } from './ExpenseGroupBlock'
import { SettlingMoney } from './SettlingMoney'

interface ExpenseGroupsProps {
  site: SiteSettings
  categories: Category[]
  lineItems: LineItem[]
  attachments: Attachment[]
  allocated: number
  onOpenItem: (id: string) => void
  onAddExpense: () => void
}

export function ExpenseGroups({
  site,
  categories,
  lineItems,
  attachments,
  allocated,
  onOpenItem,
  onAddExpense,
}: ExpenseGroupsProps) {
  const runningTotal = expensesRunningTotal(categories, lineItems)
  const moneyLeft = allocated - runningTotal
  const over = moneyLeft < 0
  const seenIds = useRef(new Set(lineItems.map((i) => i.id)))
  const [enteringIds, setEnteringIds] = useState<Set<string>>(() => new Set())

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

  return (
    <section
      id="expenses"
      className="relative scroll-mt-24 border-t border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--grove)_4%,transparent)] page-pad py-24"
    >
      <div className="page-shell">
        <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[560px]">
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
          </div>
          <button
            type="button"
            onClick={onAddExpense}
            className="self-start text-sm font-semibold tracking-[0.04em] text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
          >
            Add expense
          </button>
        </div>

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
              lineItems={lineItems}
              attachments={attachments}
              enteringIds={enteringIds}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>

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
