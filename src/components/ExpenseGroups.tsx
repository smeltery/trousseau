import type { Attachment, Category, CategoryGroup, LineItem } from '../db/types'
import { db, newId } from '../db/dexie'
import { categoryTotals, GROUP_ORDER, groupCategories, STATUS_LABELS } from '../lib/budget'
import { formatMoney } from '../lib/money'
import { sketches } from '../lib/sketches'
import { patchSiteSettings, type SiteSettings } from '../lib/site-settings'
import { EditableText } from './EditableText'

interface ExpenseGroupsProps {
  site: SiteSettings
  categories: Category[]
  lineItems: LineItem[]
  attachments: Attachment[]
  onOpenItem: (id: string) => void
  onAddExpense: () => void
}

export function ExpenseGroups({
  site,
  categories,
  lineItems,
  attachments,
  onOpenItem,
  onAddExpense,
}: ExpenseGroupsProps) {
  return (
    <section
      id="expenses"
      className="relative border-t border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--grove)_4%,transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--max)] px-6 py-24 sm:px-10 lg:px-16">
        <img
          src={sketches.venue}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-16 right-4 w-24 opacity-45 select-none sm:right-10 sm:w-28"
        />

        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <EditableText
              aria-label="Expenses section eyebrow"
              value={site.expensesEyebrow}
              onSave={(expensesEyebrow) => patchSiteSettings({ expensesEyebrow })}
              className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--lichen)] uppercase"
            />
            <EditableText
              aria-label="Expenses section title"
              value={site.expensesTitle}
              onSave={(expensesTitle) => patchSiteSettings({ expensesTitle })}
              className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]"
            />
            <EditableText
              aria-label="Expenses section description"
              value={site.expensesSub}
              onSave={(expensesSub) => patchSiteSettings({ expensesSub })}
              multiline
              className="mt-4 text-[var(--ink-muted)]"
            />
          </div>
          <button
            type="button"
            onClick={onAddExpense}
            className="self-start text-sm font-semibold tracking-wide text-[var(--accent-deep)] underline decoration-1 underline-offset-6 hover:text-[var(--ink)]"
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
              onOpenItem={onOpenItem}
            />
          ))}
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
  onOpenItem,
}: {
  group: CategoryGroup
  groupLabel: string
  onRenameGroup: (next: string) => void | Promise<void>
  cats: Category[]
  lineItems: LineItem[]
  attachments: Attachment[]
  onOpenItem: (id: string) => void
}) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <EditableText
          aria-label="Expense group label"
          value={groupLabel}
          onSave={onRenameGroup}
          className="text-[0.7rem] font-semibold tracking-[0.22em] text-[var(--ink-faint)] uppercase"
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
            const totals = categoryTotals(items)
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
                      className="min-w-0 flex-1 font-[family-name:var(--font-display)] text-2xl tracking-tight"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${cat.name}`}
                      className="shrink-0 text-sm text-[var(--ink-faint)] opacity-0 transition-opacity group-hover/cat:opacity-100 hover:text-[var(--danger)] focus:opacity-100"
                      onClick={async () => {
                        if (
                          !confirm(
                            `Remove “${cat.name}” and its ${items.length} expense line${items.length === 1 ? '' : 's'}?`,
                          )
                        ) {
                          return
                        }
                        await db.transaction(
                          'rw',
                          db.categories,
                          db.lineItems,
                          db.attachments,
                          async () => {
                            for (const item of items) {
                              await db.attachments.where('lineItemId').equals(item.id).delete()
                            }
                            await db.lineItems.where('categoryId').equals(cat.id).delete()
                            await db.categories.delete(cat.id)
                          },
                        )
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-[var(--ink-muted)]">
                    {formatMoney(totals.paid)}
                    {totals.amount > 0 ? ` / ${formatMoney(totals.amount)}` : ''}
                  </p>
                </div>
                <ul className="border-t border-[var(--line)]">
                  {items.length === 0 ? (
                    <li className="py-4 text-sm text-[var(--ink-faint)]">No expenses in this category.</li>
                  ) : (
                    items.map((item) => {
                      const noteHint = item.notes?.trim()
                      const docCount = attachments.filter((a) => a.lineItemId === item.id).length
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => onOpenItem(item.id)}
                            className="group flex w-full items-center gap-4 border-b border-[var(--line-soft)] py-4 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[1.05rem] font-medium transition-colors group-hover:text-[var(--accent-deep)]">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block text-sm text-[var(--ink-faint)]">
                                {STATUS_LABELS[item.status]}
                                {item.dueDate ? ` · due ${formatDue(item.dueDate)}` : ''}
                                {noteHint ? ' · note' : ''}
                                {docCount > 0
                                  ? ` · ${docCount} doc${docCount === 1 ? '' : 's'}`
                                  : ''}
                              </span>
                            </span>
                            <span className="font-[family-name:var(--font-display)] text-xl tabular-nums tracking-tight">
                              {item.paidAmount > 0
                                ? formatMoney(item.paidAmount)
                                : item.amount > 0
                                  ? formatMoney(item.amount)
                                  : '-'}
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

function formatDue(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
