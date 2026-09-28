import { useEffect, useRef, useState } from 'react'
import type { Attachment, Category, CategoryGroup, LineItem } from '../db/types'
import { db, newId } from '../db/dexie'
import { GROUP_ORDER, groupCategories } from '../lib/budget'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import {
  categoryDisplayTotals,
  expensesRunningTotal,
  formatDue,
  paperLineStatus,
} from '../lib/expense-display'
import { formatMoney } from '../lib/money'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { showToast } from '../lib/toast'
import { EditableText } from './EditableText'
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
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--lichen)] uppercase">
              Money left
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[40px] leading-12 tracking-[-0.02em]">
              <SettlingMoney value={moneyLeft} />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ExpenseGroupBlock({
  group,
  groupLabel,
  onRenameGroup,
  cats,
  lineItems,
  attachments,
  enteringIds,
  onOpenItem,
}: {
  group: CategoryGroup
  groupLabel: string
  onRenameGroup: (next: string) => void | Promise<void>
  cats: Category[]
  lineItems: LineItem[]
  attachments: Attachment[]
  enteringIds: Set<string>
  onOpenItem: (id: string) => void
}) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <EditableText
          aria-label="Expense group label"
          value={groupLabel}
          onSave={onRenameGroup}
          className="w-full text-[11px] font-semibold leading-[14px] tracking-[0.22em] text-[var(--ink-faint)] uppercase"
        />
        <button
          type="button"
          className="text-sm font-semibold text-[var(--accent-deep)] hover:underline"
          onClick={async () => {
            const sort =
              cats.length === 0 ? 0 : Math.max(...cats.map((c) => c.sort), 0) + 1
            await db.categories.add({
              id: newId('cat'),
              name: 'New category',
              group,
              sort,
            })
          }}
        >
          Add category
        </button>
      </div>

      {cats.length === 0 ? (
        <p className="text-[var(--ink-faint)]">No categories yet. Add one to start tracking.</p>
      ) : (
        <div className="space-y-10">
          {cats.map((cat) => {
            const items = lineItems
              .filter((i) => i.categoryId === cat.id)
              .sort((a, b) => a.sort - b.sort)
            const totals = categoryDisplayTotals(items)
            return (
              <div key={cat.id} className="group/cat">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-baseline gap-3">
                    <EditableText
                      aria-label="Category name"
                      value={cat.name}
                      onSave={async (name) => {
                        await db.categories.update(cat.id, { name })
                      }}
                      className="min-w-0 flex-1 font-[family-name:var(--font-display)] text-[28px] leading-[34px] tracking-[-0.02em]"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${cat.name}`}
                      className="shrink-0 text-sm text-[var(--ink-faint)] opacity-0 transition-opacity group-hover/cat:opacity-100 hover:text-[var(--danger)] focus:opacity-100"
                      onClick={async () => {
                        const ok = await askConfirm({
                          title: `Remove “${cat.name}”?`,
                          body: `Also deletes its ${items.length} expense line${items.length === 1 ? '' : 's'}.`,
                          confirmLabel: 'Remove',
                          danger: true,
                        })
                        if (!ok) return
                        await dbWrite(() =>
                          db.transaction('rw', db.categories, db.lineItems, db.attachments, async () => {
                            for (const item of items) {
                              await db.attachments.where('lineItemId').equals(item.id).delete()
                            }
                            await db.lineItems.where('categoryId').equals(cat.id).delete()
                            await db.categories.delete(cat.id)
                          }),
                        )
                        showToast('Category removed')
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="shrink-0 text-sm leading-[18px] tabular-nums text-[var(--ink-muted)]">
                    {formatMoney(totals.paid)} paid
                    {totals.amount > 0 ? ` · ${formatMoney(totals.amount)} budget` : ''}
                  </p>
                </div>
                <ul>
                  {items.length === 0 ? (
                    <li className="py-4 text-sm text-[var(--ink-faint)]">No expenses in this category.</li>
                  ) : (
                    items.map((item) => {
                      const noteHint = item.notes?.trim()
                      const docCount = attachments.filter((a) => a.lineItemId === item.id).length
                      const { label: statusLabel, tone: statusTone } = paperLineStatus(item)
                      const amount =
                        item.paidAmount > 0
                          ? formatMoney(item.paidAmount)
                          : item.amount > 0
                            ? formatMoney(item.amount)
                            : '-'
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => onOpenItem(item.id)}
                            className={`expense-row group flex w-full items-center gap-4 border-b border-[var(--line-soft)] py-[14px] text-left hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]${
                              enteringIds.has(item.id) ? ' expense-row-enter' : ''
                            }`}
                          >
                            <span className="min-w-0 flex-1 grow basis-0">
                              <span className="block text-base leading-5 transition-colors group-hover:text-[var(--accent-deep)]">
                                {item.label}
                              </span>
                              {(noteHint || docCount > 0 || item.dueDate) && (
                                <span className="mt-0.5 block text-sm text-[var(--ink-faint)]">
                                  {item.dueDate ? `due ${formatDue(item.dueDate)}` : ''}
                                  {noteHint ? `${item.dueDate ? ' · ' : ''}note` : ''}
                                  {docCount > 0
                                    ? `${item.dueDate || noteHint ? ' · ' : ''}${docCount} doc${docCount === 1 ? '' : 's'}`
                                    : ''}
                                </span>
                              )}
                            </span>
                            <span
                              className={`flex w-[72px] shrink-0 items-center text-[12px] font-semibold tracking-[0.08em] uppercase leading-4 ${statusTone}`}
                            >
                              {statusLabel}
                            </span>
                            <span className="flex w-[120px] shrink-0 justify-end font-[family-name:var(--font-display)] text-[20px] leading-6 tabular-nums">
                              {amount}
                            </span>
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
