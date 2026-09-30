import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, Fund, LineItem } from '../../db/types'
import { buildCommands } from '../../lib/build-commands'
import { celebrate } from '../../lib/celebrate'
import { goToSharedBudget } from '../../lib/cloud/navigate'
import { filterCommands, GROUP_ORDER, type CommandItem } from '../../lib/command-types'
import { showToast } from '../../lib/toast'
import { useDialogFocus } from '../../lib/use-dialog-focus'
import { ImportBackupDialog } from '../ImportBackupDialog'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl?: string
  lineItems: LineItem[]
  categories: Category[]
  funds: Fund[]
  onAddExpense: () => void
  onOpenItem: (id: string) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  shareUrl,
  lineItems,
  categories,
  funds,
  onAddExpense,
  onOpenItem,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [importOpen, setImportOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  useDialogFocus(dialogRef, open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setQuery('')
      setActive(0)
    }
  }

  const commands = useMemo(
    () =>
      buildCommands({
        shareUrl,
        lineItems,
        categories,
        funds,
        navigate,
        onAddExpense,
        onOpenItem,
        onImport: () => setImportOpen(true),
      }),
    [shareUrl, lineItems, categories, funds, navigate, onAddExpense, onOpenItem],
  )

  const filtered = useMemo(() => filterCommands(commands, query), [commands, query])
  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        items: filtered.filter((c) => c.group === group),
      })).filter((g) => g.items.length > 0),
    [filtered],
  )
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
        return
      }
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    function onCustom() {
      onOpenChange(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('trousseau:command', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('trousseau:command', onCustom)
    }
  }, [open, onOpenChange])

  async function run(cmd: CommandItem) {
    onOpenChange(false)
    await cmd.run()
  }

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:px-6">
          <button
            type="button"
            aria-label="Close command menu"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--grove)_72%,transparent)] animate-[fade-in_0.2s_ease] backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="relative z-10 flex max-h-[min(28rem,70dvh)] w-full max-w-xl flex-col overflow-hidden rounded-sm border border-[var(--line-soft)] bg-[var(--wash)] shadow-[var(--sheet-shadow)] animate-[drop-in_0.25s_var(--ease-out)]"
          >
            <div className="border-b border-[var(--line-soft)] px-4 py-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((i) => Math.max(i - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const cmd = flat[active]
                    if (cmd) void run(cmd)
                  }
                }}
                placeholder="Jump, create, open, or share…"
                className="w-full bg-transparent text-base outline-none placeholder:text-[var(--ink-faint)]"
                aria-autocomplete="list"
                aria-controls="command-list"
              />
            </div>
            <div
              ref={listRef}
              id="command-list"
              role="listbox"
              className="min-h-0 flex-1 overflow-y-auto py-2"
            >
              {flat.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--ink-muted)]">No matching commands.</p>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group} className="mb-2">
                    <p className="px-4 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-faint)] uppercase">
                      {group}
                    </p>
                    <ul>
                      {items.map((cmd) => {
                        const index = flat.indexOf(cmd)
                        const selected = index === active
                        return (
                          <li key={cmd.id} role="option" aria-selected={selected}>
                            <button
                              type="button"
                              data-cmd-index={index}
                              onMouseEnter={() => setActive(index)}
                              onClick={() => void run(cmd)}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                selected
                                  ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--ink)]'
                                  : 'text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                              }`}
                            >
                              <span className="min-w-0 truncate">{cmd.label}</span>
                              {cmd.hint ? (
                                <span className="shrink-0 text-xs text-[var(--ink-faint)]">
                                  {cmd.hint}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--line-soft)] px-4 py-2 text-[11px] text-[var(--ink-faint)]">
              <span>
                <kbd className="font-[family-name:var(--font-body)]">↑↓</kbd> move ·{' '}
                <kbd className="font-[family-name:var(--font-body)]">↵</kbd> run ·{' '}
                <kbd className="font-[family-name:var(--font-body)]">esc</kbd> close
              </span>
              <span>
                <kbd className="font-[family-name:var(--font-body)]">⌘K</kbd>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {importOpen ? (
        <ImportBackupDialog
          onClose={() => setImportOpen(false)}
          onImported={(share) => {
            setImportOpen(false)
            if (share) {
              showToast('Imported: share link copied')
              celebrate()
              goToSharedBudget(share.token, navigate)
            } else {
              showToast('Import needs a share link. Try again.')
            }
          }}
        />
      ) : null}
    </>
  )
}
