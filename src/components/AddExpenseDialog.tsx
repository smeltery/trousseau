import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../db/dexie'
import type { CategoryGroup } from '../db/types'
import { GROUP_LABELS } from '../lib/budget'
import { showToast } from '../lib/toast'
import { useDialogFocus } from '../lib/use-dialog-focus'

interface AddExpenseDialogProps {
  onClose: () => void
  onCreated: (lineItemId: string) => void
}

export function AddExpenseDialog({ onClose, onCreated }: AddExpenseDialogProps) {
  const titleId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const categories = useLiveQuery(() => db.categories.orderBy('sort').toArray()) ?? []
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newGroup, setNewGroup] = useState<CategoryGroup>('vendor')
  const [label, setLabel] = useState('Deposit')
  const selectedCategoryId = categoryId || categories[0]?.id || ''

  useDialogFocus(formRef)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    let catId = selectedCategoryId

    if (mode === 'new') {
      const name = newCategoryName.trim()
      if (!name) return
      const sort =
        categories.length === 0 ? 0 : Math.max(...categories.map((c) => c.sort)) + 1
      catId = newId('cat')
      await db.categories.add({ id: catId, name, group: newGroup, sort })
    }

    if (!catId) return

    const siblings = await db.lineItems.where('categoryId').equals(catId).toArray()
    const sort = siblings.length ? Math.max(...siblings.map((s) => s.sort)) + 1 : 0
    const id = newId('line')
    await db.lineItems.add({
      id,
      categoryId: catId,
      label: label.trim() || 'Expense',
      amount: 0,
      paidAmount: 0,
      status: 'planned',
      sort,
    })
    showToast('Expense added')
    onCreated(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_40%,transparent)] animate-[fade-in_0.25s_ease]"
        onClick={onClose}
      />
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => void submit(e)}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-[var(--wash)] p-6 shadow-[var(--sheet-shadow)] animate-[sheet-in_0.35s_var(--ease-out)] sm:rounded-2xl"
      >
        <h2
          id={titleId}
          className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight"
        >
          Add expense
        </h2>

        <div className="mt-6 flex gap-2">
          <Toggle active={mode === 'existing'} onClick={() => setMode('existing')}>
            Existing category
          </Toggle>
          <Toggle active={mode === 'new'} onClick={() => setMode('new')}>
            New category
          </Toggle>
        </div>

        <div className="mt-5 space-y-4">
          {mode === 'existing' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                Category
              </span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {GROUP_LABELS[c.group]} · {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                  Category name
                </span>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                  required
                  placeholder="Florist"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                  Group
                </span>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as CategoryGroup)}
                  className="w-full rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                >
                  {(Object.keys(GROUP_LABELS) as CategoryGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {GROUP_LABELS[g]}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Line label
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-sm border border-[var(--line)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--accent)]"
              required
            />
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-[var(--ink-muted)]">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'text-[var(--ink-muted)] hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]'
      }`}
    >
      {children}
    </button>
  )
}
