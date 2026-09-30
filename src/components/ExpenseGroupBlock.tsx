import type { Attachment, Category, CategoryGroup, LineItem } from '../db/types'
import { db, newId } from '../db/dexie'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import {
  canMarkPaid,
  categoryDisplayTotals,
  formatDue,
  formatLineAmount,
  markPaidPatch,
  paperLineStatus,
} from '../lib/expense-display'
import { formatMoney } from '../lib/money'
import { swapSort } from '../lib/reorder'
import { showToast } from '../lib/toast'
import { EditableText } from './EditableText'

export function ExpenseGroupBlock({
  group,
  groupLabel,
  onRenameGroup,
  cats,
  lineItems,
  allLineItems,
  attachments,
  enteringIds,
  filterActive,
  onOpenItem,
}: {
  group: CategoryGroup
  groupLabel: string
  onRenameGroup: (next: string) => void | Promise<void>
  cats: Category[]
  lineItems: LineItem[]
  allLineItems: LineItem[]
  attachments: Attachment[]
  enteringIds: Set<string>
  filterActive?: boolean
  onOpenItem: (id: string) => void
}) {
  const visibleCats = filterActive
    ? cats.filter((c) => lineItems.some((i) => i.categoryId === c.id))
    : cats

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
            const sort = cats.length === 0 ? 0 : Math.max(...cats.map((c) => c.sort), 0) + 1
            await dbWrite(() =>
              db.categories.add({ id: newId('cat'), name: 'New category', group, sort }),
            )
          }}
        >
          Add category
        </button>
      </div>

      {visibleCats.length === 0 ? (
        <p className="text-[var(--ink-faint)]">
          {filterActive ? 'Nothing matches this filter.' : 'No categories yet. Add one to start tracking.'}
        </p>
      ) : (
        <div className="space-y-10">
          {visibleCats.map((cat, catIndex) => {
            const items = lineItems
              .filter((i) => i.categoryId === cat.id)
              .sort((a, b) => a.sort - b.sort)
            const totals = categoryDisplayTotals(
              allLineItems.filter((i) => i.categoryId === cat.id),
            )
            const siblingCats = cats
            return (
              <div key={cat.id}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2 sm:gap-3">
                    <EditableText
                      aria-label="Category name"
                      value={cat.name}
                      onSave={async (name) => {
                        await dbWrite(() => db.categories.update(cat.id, { name }))
                      }}
                      className="min-w-0 flex-1 font-[family-name:var(--font-display)] text-[28px] leading-[34px] tracking-[-0.02em]"
                    />
                    {!filterActive && siblingCats.length > 1 ? (
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${cat.name} up`}
                          disabled={catIndex === 0}
                          className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
                          onClick={async () => {
                            const prev = siblingCats[catIndex - 1]
                            if (!prev) return
                            await dbWrite(() => swapSort('categories', cat.id, prev.id))
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${cat.name} down`}
                          disabled={catIndex === siblingCats.length - 1}
                          className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
                          onClick={async () => {
                            const next = siblingCats[catIndex + 1]
                            if (!next) return
                            await dbWrite(() => swapSort('categories', cat.id, next.id))
                          }}
                        >
                          ↓
                        </button>
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Remove ${cat.name}`}
                      className="shrink-0 text-sm text-[var(--ink-faint)] hover:text-[var(--danger)]"
                      onClick={async () => {
                        const full = allLineItems.filter((i) => i.categoryId === cat.id)
                        const ok = await askConfirm({
                          title: `Remove “${cat.name}”?`,
                          body: `Also deletes its ${full.length} expense line${full.length === 1 ? '' : 's'}.`,
                          confirmLabel: 'Remove',
                          danger: true,
                        })
                        if (!ok) return
                        await dbWrite(() =>
                          db.transaction('rw', db.categories, db.lineItems, db.attachments, async () => {
                            for (const item of full) {
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
                    items.map((item, itemIndex) => {
                      const noteHint = item.notes?.trim()
                      const docCount = attachments.filter((a) => a.lineItemId === item.id).length
                      const { label: statusLabel, tone: statusTone } = paperLineStatus(item)
                      const amount = formatLineAmount(item)
                      const showMarkPaid = canMarkPaid(item)
                      const siblings = allLineItems
                        .filter((i) => i.categoryId === cat.id)
                        .sort((a, b) => a.sort - b.sort)
                      return (
                        <li key={item.id}>
                          <div
                            className={`expense-row group flex w-full items-center gap-2 border-b border-[var(--line-soft)] py-[14px] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] sm:gap-3${
                              enteringIds.has(item.id) ? ' expense-row-enter' : ''
                            }`}
                          >
                            {!filterActive && siblings.length > 1 ? (
                              <span className="flex shrink-0 flex-col gap-0.5">
                                <button
                                  type="button"
                                  aria-label={`Move ${item.label} up`}
                                  disabled={itemIndex === 0}
                                  className="px-1 text-[10px] text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
                                  onClick={async () => {
                                    const prev = siblings[itemIndex - 1]
                                    if (!prev) return
                                    await dbWrite(() => swapSort('lineItems', item.id, prev.id))
                                  }}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Move ${item.label} down`}
                                  disabled={itemIndex === siblings.length - 1}
                                  className="px-1 text-[10px] text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30"
                                  onClick={async () => {
                                    const next = siblings[itemIndex + 1]
                                    if (!next) return
                                    await dbWrite(() => swapSort('lineItems', item.id, next.id))
                                  }}
                                >
                                  ↓
                                </button>
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onOpenItem(item.id)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                            >
                              <span className="min-w-0 flex-1 grow basis-0">
                                <span className="block text-base leading-5 transition-colors group-hover:text-[var(--accent-deep)]">
                                  {item.label}
                                </span>
                                <span className="mt-0.5 block text-sm text-[var(--ink-faint)]">
                                  {item.dueDate ? (
                                    <span className={statusLabel === 'Overdue' ? 'text-[var(--danger)]' : undefined}>
                                      Due {formatDue(item.dueDate)}
                                    </span>
                                  ) : (
                                    <span>No due date</span>
                                  )}
                                  {noteHint ? ' · note' : ''}
                                  {docCount > 0 ? ` · ${docCount} doc${docCount === 1 ? '' : 's'}` : ''}
                                </span>
                              </span>
                              <span
                                className={`hidden w-[72px] shrink-0 items-center text-[12px] font-semibold tracking-[0.08em] uppercase leading-4 sm:flex ${statusTone}`}
                              >
                                {statusLabel}
                              </span>
                              <span className="flex w-[100px] shrink-0 justify-end font-[family-name:var(--font-display)] text-[18px] leading-6 tabular-nums sm:w-[140px] sm:text-[20px]">
                                {amount}
                              </span>
                            </button>
                            {showMarkPaid ? (
                              <button
                                type="button"
                                aria-label={`Mark ${item.label} paid`}
                                className="shrink-0 px-1 text-xs font-semibold tracking-[0.04em] text-[var(--accent-deep)] hover:underline sm:px-2"
                                onClick={async () => {
                                  await dbWrite(() => db.lineItems.update(item.id, markPaidPatch(item)))
                                  showToast('Marked paid')
                                }}
                              >
                                Paid
                              </button>
                            ) : (
                              <span
                                className={`w-10 shrink-0 text-center text-[11px] font-semibold tracking-[0.06em] uppercase sm:hidden ${statusTone}`}
                              >
                                {statusLabel === '-' ? '' : statusLabel.slice(0, 4)}
                              </span>
                            )}
                          </div>
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
