import type { LineItem } from '../../db/types'
import type { DueKind } from '../../lib/calendar-dues'
import { formatLineAmount, paperLineStatus } from '../../lib/expense-display'
import { encodeDragPayload } from './day-drop'
import { TONE_CHIP } from './tones'

export function DueChip({
  item,
  today,
  dueKind,
  onOpen,
  draggable = true,
}: {
  item: LineItem
  today: string
  dueKind: DueKind
  onOpen: () => void
  compact?: boolean
  draggable?: boolean
}) {
  const { label: status, chip } = paperLineStatus(item, today)
  const amount = formatLineAmount(item)
  const amountHint = amount === '-' ? '' : amount
  const kindLabel =
    dueKind === 'balance' ? 'Balance' : dueKind === 'deposit' ? 'Deposit' : 'Installment'
  const name = `${kindLabel} · ${item.label}`
  const dateField =
    dueKind === 'balance' ? 'balance' : dueKind === 'deposit' ? 'deposit' : 'installment'
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        const payload = encodeDragPayload(item.id, dueKind)
        e.dataTransfer.setData('application/x-trousseau-line', payload)
        e.dataTransfer.setData('text/plain', payload)
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={`${name}${amountHint ? ` · ${amountHint}` : ''} · ${status}. Drag to reschedule or open.`}
      aria-label={`Open ${name}${amountHint ? `, ${amountHint}` : ''}, ${status}. Drag to another day to change ${dateField} date.`}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className={`min-h-7 cursor-grab truncate rounded-[2px] px-1.5 py-1 text-left text-[10px] leading-3 font-medium tracking-[0.01em] shadow-none transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:shadow-[0_1px_4px_color-mix(in_srgb,var(--grove)_18%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-deep)] active:cursor-grabbing active:translate-y-0 sm:min-h-0 sm:text-[11px] sm:leading-4 ${TONE_CHIP[chip]}`}
    >
      <span className="sm:hidden">{name}</span>
      <span className="hidden sm:inline">
        {name}
        {amountHint ? ` · ${amountHint}` : ''}
      </span>
    </button>
  )
}
