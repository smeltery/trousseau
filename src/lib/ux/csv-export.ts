import type { Category, Fund, LineItem } from '../../db/types'
import { earliestDueDate, remainingDue } from '../calendar'
import { downloadBlob } from '../export-import'
import { whoPaysLabel } from './who-pays-label'
import type { SiteSettings } from '../site-settings'

function csvEscape(value: string | number | boolean | undefined | null): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean | undefined | null>>): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return `${lines.join('\n')}\n`
}

export function giftsCsv(funds: Fund[]): string {
  const gifts = funds.filter((f) => f.type === 'gift').sort((a, b) => a.sort - b.sort)
  return toCsv(
    ['label', 'amount', 'source', 'receivedDate', 'thanked', 'earmarkCategoryId', 'status'],
    gifts.map((f) => [
      f.label,
      f.amount,
      f.source ?? '',
      f.receivedDate ?? '',
      Boolean(f.thanked),
      f.earmarkCategoryId ?? '',
      f.receivedDate ? 'received' : 'promised',
    ]),
  )
}

export function expensesCsv(
  items: LineItem[],
  categories: Category[],
  site: SiteSettings,
): string {
  const cat = new Map(categories.map((c) => [c.id, c]))
  const sorted = [...items].sort((a, b) => a.sort - b.sort)
  return toCsv(
    [
      'label',
      'category',
      'group',
      'amount',
      'paidAmount',
      'status',
      'dueDate',
      'balanceDue',
      'whoPays',
      'vendorUrl',
      'notes',
    ],
    sorted.map((i) => {
      const c = cat.get(i.categoryId)
      return [
        i.label,
        c?.name ?? '',
        c?.group ?? '',
        i.amount,
        i.paidAmount,
        i.status,
        i.dueDate ?? '',
        i.remainingBalanceDueDate ?? '',
        whoPaysLabel(i.whoPays, site) ?? i.whoPays ?? '',
        i.vendorUrl ?? '',
        i.notes ?? '',
      ]
    }),
  )
}

export function duesCsv(items: LineItem[], categories: Category[]): string {
  const cat = new Map(categories.map((c) => [c.id, c.name]))
  const rows = items
    .filter((i) => remainingDue(i) > 0 && earliestDueDate(i))
    .sort((a, b) => (earliestDueDate(a) ?? '').localeCompare(earliestDueDate(b) ?? ''))
  return toCsv(
    ['dueDate', 'label', 'category', 'remaining', 'status'],
    rows.map((i) => [
      earliestDueDate(i) ?? '',
      i.label,
      cat.get(i.categoryId) ?? '',
      remainingDue(i),
      i.status,
    ]),
  )
}

export function downloadTrackerCsvs(
  funds: Fund[],
  items: LineItem[],
  categories: Category[],
  site: SiteSettings,
): void {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadBlob(new Blob([giftsCsv(funds)], { type: 'text/csv' }), `trousseau-gifts-${stamp}.csv`)
  downloadBlob(
    new Blob([expensesCsv(items, categories, site)], { type: 'text/csv' }),
    `trousseau-expenses-${stamp}.csv`,
  )
  downloadBlob(new Blob([duesCsv(items, categories)], { type: 'text/csv' }), `trousseau-dues-${stamp}.csv`)
}
