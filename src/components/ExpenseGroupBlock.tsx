import type { Attachment, Category, CategoryGroup, LineItem } from '../db/types'
import { db, newId } from '../db/dexie'
import { askConfirm } from '../lib/confirm'
import { dbWrite } from '../lib/db-write'
import { categoryDisplayTotals } from '../lib/expense-display'
import { formatMoney, sum } from '../lib/money'
import { swapSort } from '../lib/reorder'
import { showToast } from '../lib/toast'
import { EditableText } from './EditableText'
import { ExpenseLineRow } from './expenses/ExpenseLineRow'

const reorderBtn =
  'flex h-8 w-8 items-center justify-center text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30'

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
  selectMode,
  selectedIds,
  onToggleSelect,
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
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
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
            const catAll = allLineItems.filter((i) => i.categoryId === cat.id)
            const totals = categoryDisplayTotals(catAll)
            const committed = sum(
              catAll.filter((i) => !/^budget$/i.test(i.label.trim())).map((i) => i.amount),
            )
            const envelopeLeft = totals.amount - committed
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
                      <span className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          aria-label={`Move ${cat.name} up`}
                          disabled={catIndex === 0}
                          className={reorderBtn}
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
                          className={reorderBtn}
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
                    {totals.amount > 0 ? (
                      <>
                        {' · '}
                        <span className={envelopeLeft < 0 ? 'text-[var(--danger)]' : ''}>
                          {envelopeLeft < 0
                            ? `${formatMoney(Math.abs(envelopeLeft))} over`
                            : `${formatMoney(envelopeLeft)} left`}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <ul>
                  {items.length === 0 ? (
                    <li className="py-4 text-sm text-[var(--ink-faint)]">No expenses in this category.</li>
                  ) : (
                    items.map((item, itemIndex) => (
                      <ExpenseLineRow
                        key={item.id}
                        item={item}
                        itemIndex={itemIndex}
                        siblings={allLineItems
                          .filter((i) => i.categoryId === cat.id)
                          .sort((a, b) => a.sort - b.sort)}
                        docCount={attachments.filter((a) => a.lineItemId === item.id).length}
                        entering={enteringIds.has(item.id)}
                        filterActive={Boolean(filterActive)}
                        selectMode={Boolean(selectMode)}
                        selected={Boolean(selectedIds?.has(item.id))}
                        onToggleSelect={onToggleSelect}
                        onOpenItem={onOpenItem}
                      />
                    ))
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
