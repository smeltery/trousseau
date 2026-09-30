import type { NavigateFunction } from 'react-router-dom'
import { db, newId } from '../db/dexie'
import type { Category, Fund, LineItem } from '../db/types'
import { downloadBackupZip } from './backup-actions'
import { buildDueDatesIcs, todayKey } from './calendar'
import type { CommandItem } from './command-types'
import { askConfirm } from './confirm'
import { dbWrite } from './db-write'
import { canMarkPaid, markPaidPatch } from './expense-display'
import { downloadBlob } from './export-import'
import { replaceBudgetAndShare } from './replace-budget'
import { showToast } from './toast'

export type CommandContext = {
  shareUrl?: string
  lineItems: LineItem[]
  categories: Category[]
  funds: Fund[]
  navigate: NavigateFunction
  onAddExpense: () => void
  onOpenItem: (id: string) => void
  onImport: () => void
}

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

export function buildCommands(ctx: CommandContext): CommandItem[] {
  const catName = new Map(ctx.categories.map((c) => [c.id, c.name]))
  const today = todayKey()
  const unpaid = ctx.lineItems.filter((i) => canMarkPaid(i))
  const overdue = unpaid.filter((i) => i.dueDate && i.dueDate < today)
  const dated = ctx.lineItems.filter((i) => Boolean(i.dueDate))

  const commands: CommandItem[] = [
    {
      id: 'nav-top',
      label: 'Go to overview',
      group: 'Navigate',
      keywords: 'home top hero',
      run: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
    {
      id: 'nav-gifts',
      label: 'Go to gifts & savings',
      group: 'Navigate',
      keywords: 'funds money',
      run: () => jump('gift-summary'),
    },
    {
      id: 'nav-expenses',
      label: 'Go to expenses',
      group: 'Navigate',
      keywords: 'vendors categories',
      run: () => jump('expenses'),
    },
    {
      id: 'nav-calendar',
      label: 'Go to calendar',
      group: 'Navigate',
      keywords: 'due dates schedule',
      run: () => jump('calendar'),
    },
    {
      id: 'nav-backup',
      label: 'Go to backup',
      group: 'Navigate',
      keywords: 'export import share',
      run: () => jump('backup'),
    },
    {
      id: 'about',
      label: 'About Trousseau',
      group: 'Navigate',
      keywords: 'marketing home help',
      run: () => ctx.navigate('/'),
    },
    {
      id: 'add-expense',
      label: 'Add expense',
      hint: 'N',
      group: 'Create',
      keywords: 'new line item vendor',
      run: () => ctx.onAddExpense(),
    },
    {
      id: 'add-gift',
      label: 'Add gift',
      group: 'Create',
      keywords: 'fund money received',
      run: async () => {
        const gifts = ctx.funds.filter((f) => f.type === 'gift')
        const sort = gifts.length ? Math.max(...gifts.map((f) => f.sort)) + 1 : 0
        await dbWrite(() =>
          db.funds.add({ id: newId('fund'), label: 'New gift', amount: 0, type: 'gift', sort }),
        )
        showToast('Gift added')
        jump('gift-summary')
      },
    },
    {
      id: 'add-savings',
      label: 'Add savings',
      group: 'Create',
      keywords: 'fund money',
      run: async () => {
        const rows = ctx.funds.filter((f) => f.type === 'savings')
        const sort = rows.length ? Math.max(...rows.map((f) => f.sort)) + 1 : 0
        await dbWrite(() =>
          db.funds.add({ id: newId('fund'), label: 'New savings', amount: 0, type: 'savings', sort }),
        )
        showToast('Savings added')
        jump('gift-summary')
      },
    },
    {
      id: 'copy-share',
      label: 'Copy share link',
      group: 'Share & backup',
      keywords: 'url partner sync clipboard',
      run: async () => {
        if (!ctx.shareUrl) {
          showToast('Share link not ready yet')
          return
        }
        try {
          await navigator.clipboard.writeText(ctx.shareUrl)
          showToast('Share link copied')
        } catch {
          showToast(ctx.shareUrl)
        }
      },
    },
    {
      id: 'export-backup',
      label: 'Export backup zip',
      group: 'Share & backup',
      keywords: 'download archive',
      run: async () => {
        try {
          await downloadBackupZip()
          showToast('Backup downloaded')
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Export failed')
        }
      },
    },
    {
      id: 'import-backup',
      label: 'Import backup',
      group: 'Share & backup',
      keywords: 'restore zip upload',
      run: () => ctx.onImport(),
    },
    {
      id: 'new-blank',
      label: 'Start blank budget',
      group: 'Share & backup',
      keywords: 'reset wipe new',
      run: async () => {
        const ok = await askConfirm({
          title: 'Start a blank budget?',
          body: 'This replaces your current budget and creates a new share link. Export a backup first if you want to keep this one.',
          confirmLabel: 'Start blank',
          danger: true,
        })
        if (!ok) return
        try {
          await replaceBudgetAndShare('blank', ctx.navigate)
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not create share link')
        }
      },
    },
    {
      id: 'load-demo',
      label: 'Load demo sample',
      group: 'Share & backup',
      keywords: 'example wedding sample',
      run: async () => {
        const ok = await askConfirm({
          title: 'Load the demo sample?',
          body: 'This replaces your current budget and creates a new share link. Export a backup first if you want to keep this one.',
          confirmLabel: 'Load demo',
          danger: true,
        })
        if (!ok) return
        try {
          await replaceBudgetAndShare('demo', ctx.navigate)
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not create share link')
        }
      },
    },
    {
      id: 'export-ics',
      label: 'Export due dates (.ics)',
      group: 'Calendar',
      keywords: 'apple google outlook calendar',
      run: () => {
        if (dated.length === 0) {
          showToast('Add due dates to expenses first')
          return
        }
        downloadBlob(
          new Blob(
            [buildDueDatesIcs(ctx.lineItems, (id) => catName.get(id) ?? 'Expense')],
            { type: 'text/calendar;charset=utf-8' },
          ),
          'trousseau-due-dates.ics',
        )
        showToast('Calendar file downloaded')
      },
    },
    {
      id: 'jump-overdue',
      label: overdue.length ? `Review ${overdue.length} overdue` : 'No overdue expenses',
      group: 'Calendar',
      keywords: 'late past due unpaid',
      run: () => {
        if (overdue.length === 0) {
          showToast('Nothing overdue')
          return
        }
        jump('calendar')
        if (overdue[0]) ctx.onOpenItem(overdue[0].id)
      },
    },
  ]

  for (const item of [...ctx.lineItems].sort((a, b) => a.label.localeCompare(b.label))) {
    const category = catName.get(item.categoryId) ?? 'Expense'
    commands.push({
      id: `open-${item.id}`,
      label: item.label,
      hint: category,
      group: 'Expenses',
      keywords: `${category} ${item.status} ${item.dueDate ?? ''} open edit`,
      run: () => ctx.onOpenItem(item.id),
    })
    if (canMarkPaid(item)) {
      commands.push({
        id: `paid-${item.id}`,
        label: `Mark paid · ${item.label}`,
        hint: category,
        group: 'Expenses',
        keywords: `${category} paid settle complete`,
        run: async () => {
          await dbWrite(() => db.lineItems.update(item.id, markPaidPatch(item)))
          showToast(`Marked “${item.label}” paid`)
        },
      })
    }
  }

  return commands
}
