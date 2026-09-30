import { db, newId } from '../../db/dexie'
import type { Category, Fund, FundType } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import { showToast } from '../../lib/toast'
import { EditableText } from '../EditableText'
import { FundRow } from './FundRow'

export function FundGroup({
  title,
  onRenameTitle,
  type,
  funds,
  categories,
  emptyLabel,
  emptyWhy,
  selectMode,
  selectedIds,
  onToggleSelect,
}: {
  title: string
  onRenameTitle: (next: string) => void | Promise<void>
  type: FundType
  funds: Fund[]
  categories?: Category[]
  emptyLabel: string
  emptyWhy: string
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}) {
  async function addFund() {
    const sort = funds.length ? Math.max(...funds.map((f) => f.sort)) + 1 : 0
    await dbWrite(() =>
      db.funds.add({
        id: newId('fund'),
        label: type === 'gift' ? 'New gift' : 'New savings',
        amount: 0,
        type,
        sort,
      }),
    )
    showToast(type === 'gift' ? 'Gift added' : 'Savings added')
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-0 flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-3">
        <EditableText
          aria-label={`${title} column title`}
          value={title}
          onSave={onRenameTitle}
          className="w-full text-[11px] font-semibold tracking-[0.2em] text-[var(--ink-faint)] uppercase"
        />
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4 hover:text-[var(--ink)]"
          onClick={() => void addFund()}
        >
          Add
        </button>
      </div>

      {funds.length === 0 ? (
        <div className="py-5">
          <p className="text-[var(--ink-muted)]">{emptyLabel}</p>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">{emptyWhy}</p>
          <button
            type="button"
            onClick={() => void addFund()}
            className="mt-3 text-sm font-semibold text-[var(--accent-deep)] underline decoration-1 underline-offset-4 hover:text-[var(--ink)]"
          >
            Add {type === 'gift' ? 'a gift' : 'savings'}
          </button>
        </div>
      ) : (
        <ul>
          {funds.map((fund, index) => (
            <FundRow
              key={fund.id}
              fund={fund}
              index={index}
              siblings={funds}
              categories={categories}
              selectMode={Boolean(selectMode)}
              selected={Boolean(selectedIds?.has(fund.id))}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
