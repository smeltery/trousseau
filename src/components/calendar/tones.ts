import type { DayTone } from '../../lib/calendar'

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const TONE_CELL: Record<DayTone, string> = {
  empty: 'bg-[var(--wash)]',
  paid: 'bg-[color-mix(in_srgb,var(--lichen)_16%,var(--wash))]',
  due: 'bg-[color-mix(in_srgb,var(--accent)_18%,var(--wash))]',
  overdue: 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--wash))]',
}

export const TONE_CHIP: Record<'paid' | 'due' | 'overdue' | 'partial', string> = {
  paid: 'bg-[color-mix(in_srgb,var(--lichen)_22%,transparent)] text-[var(--grove)] hover:bg-[color-mix(in_srgb,var(--lichen)_38%,transparent)]',
  due: 'bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] text-[var(--grove)] hover:bg-[color-mix(in_srgb,var(--accent)_48%,transparent)]',
  overdue:
    'bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_34%,transparent)]',
  partial:
    'bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--accent-deep)] hover:bg-[color-mix(in_srgb,var(--accent)_40%,transparent)]',
}

export type CalendarView = 'week' | 'month' | 'year'
