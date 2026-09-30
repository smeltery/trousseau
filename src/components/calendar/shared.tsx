import type { LineItem } from '../../db/types'
import { formatLineAmount, paperLineStatus } from '../../lib/expense-display'
import { TONE_CHIP } from './tones'

export function DueChip({
  item,
  today,
  onOpen,
  draggable = true,
}: {
  item: LineItem
  today: string
  onOpen: () => void
  compact?: boolean
  draggable?: boolean
}) {
  const { label: status, chip } = paperLineStatus(item, today)
  const amount = formatLineAmount(item)
  const amountHint = amount === '-' ? '' : amount
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-trousseau-line', item.id)
        e.dataTransfer.setData('text/plain', item.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={`${item.label}${amountHint ? ` · ${amountHint}` : ''} · ${status}. Drag to reschedule or open.`}
      aria-label={`Open ${item.label}${amountHint ? `, ${amountHint}` : ''}, ${status}. Drag to another day to change due date.`}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className={`min-h-7 cursor-grab truncate rounded-[2px] px-1.5 py-1 text-left text-[10px] leading-3 font-medium tracking-[0.01em] shadow-none transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:shadow-[0_1px_4px_color-mix(in_srgb,var(--grove)_18%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-deep)] active:cursor-grabbing active:translate-y-0 sm:min-h-0 sm:text-[11px] sm:leading-4 ${TONE_CHIP[chip]}`}
    >
      <span className="sm:hidden">{item.label}</span>
      <span className="hidden sm:inline">
        {item.label}
        {amountHint ? ` · ${amountHint}` : ''}
      </span>
    </button>
  )
}
