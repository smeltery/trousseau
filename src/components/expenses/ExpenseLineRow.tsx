import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { LineItem } from '../../db/types'
import { dbWrite } from '../../lib/db-write'
import {
  canMarkPaid,
  formatDue,
  formatLineAmount,
  paperLineStatus,
} from '../../lib/expense-display'
import { markPaidWithUndo } from '../../lib/ux/mark-paid'
import { whoPaysLabel } from '../../lib/ux/who-pays-label'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { swapSort } from '../../lib/reorder'

const reorderBtn =
  'flex h-8 w-8 items-center justify-center text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] disabled:opacity-30'

export function ExpenseLineRow({
  item,
  itemIndex,
  siblings,
  docCount,
  entering,
  filterActive,
  selectMode,
  selected,
  onToggleSelect,
  onOpenItem,
}: {
  item: LineItem
  itemIndex: number
  siblings: LineItem[]
  docCount: number
  entering: boolean
  filterActive: boolean
  selectMode: boolean
  selected: boolean
  onToggleSelect?: (id: string) => void
  onOpenItem: (id: string) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE
  const pays = whoPaysLabel(item.whoPays, site)
  const noteHint = item.notes?.trim()
  const noteSnippet = noteHint
    ? noteHint.length > 48
      ? `${noteHint.slice(0, 48)}…`
      : noteHint
    : null
  const { label: statusLabel, tone: statusTone } = paperLineStatus(item)
  const amount = formatLineAmount(item)
  const showMarkPaid = canMarkPaid(item)
  const vendorHost = vendorHostLabel(item.vendorUrl)

  return (
    <li>
      <div
        className={`expense-row group flex w-full items-center gap-2 border-b border-[var(--line-soft)] py-[14px] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] sm:gap-3${
          entering ? ' expense-row-enter' : ''
        }`}
      >
        {selectMode ? (
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Select ${item.label}`}
            className="size-4 shrink-0 accent-[var(--grove)]"
            onChange={() => onToggleSelect?.(item.id)}
          />
        ) : null}
        {!filterActive && siblings.length > 1 ? (
          <span className="flex shrink-0 flex-col">
            <button
              type="button"
              aria-label={`Move ${item.label} up`}
              disabled={itemIndex === 0}
              className={reorderBtn}
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
              className={reorderBtn}
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
              {pays ? ` · ${pays}` : ''}
              {vendorHost ? ` · ${vendorHost}` : ''}
              {noteSnippet ? ` · ${noteSnippet}` : ''}
              {docCount > 0 ? ` · ${docCount} doc${docCount === 1 ? '' : 's'}` : ''}
              {statusLabel !== '-' ? (
                <span className={`sm:hidden ${statusTone}`}> · {statusLabel}</span>
              ) : null}
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
        {item.vendorUrl ? (
          <a
            href={item.vendorUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open vendor link for ${item.label}`}
            className="shrink-0 px-1 text-xs font-semibold text-[var(--accent-deep)] hover:underline sm:px-2"
            onClick={(e) => e.stopPropagation()}
          >
            Link
          </a>
        ) : null}
        {showMarkPaid ? (
          <button
            type="button"
            aria-label={`Mark ${item.label} paid`}
            className="shrink-0 px-1 text-xs font-semibold tracking-[0.04em] text-[var(--accent-deep)] hover:underline sm:px-2"
            onClick={() => void markPaidWithUndo(item)}
          >
            Paid
          </button>
        ) : (
          <span className="w-10 shrink-0 sm:hidden" aria-hidden />
        )}
      </div>
    </li>
  )
}

function vendorHostLabel(url?: string): string | null {
  if (!url?.trim()) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}
