import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Category, LineItem, LineStatus } from '../../db/types'
import { GROUP_LABELS, STATUS_LABELS } from '../../lib/budget'
import { todayKey } from '../../lib/calendar'
import { dbWrite } from '../../lib/db-write'
import { parseMoneyInput } from '../../lib/money'
import { showToast } from '../../lib/toast'
import { recordPaymentWithUndo } from '../../lib/ux/record-payment'

const STATUSES: LineStatus[] = ['planned', 'deposit', 'partial', 'paid']

export function LineItemForm({ item }: { item: LineItem }) {
  const categories =
    useLiveQuery(() => db.categories.orderBy('sort').toArray(), []) ?? ([] as Category[])
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [paid, setPaid] = useState(String(item.paidAmount))
  const [status, setStatus] = useState(item.status)
  const [dueDate, setDueDate] = useState(item.dueDate ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [vendorUrl, setVendorUrl] = useState(item.vendorUrl ?? '')
  const [categoryId, setCategoryId] = useState(item.categoryId)
  const [payment, setPayment] = useState('')
  const dirty = useRef({ label: false, amount: false, paid: false, notes: false, vendorUrl: false })

  useEffect(() => {
    if (!dirty.current.label) setLabel(item.label)
    if (!dirty.current.amount) setAmount(String(item.amount))
    if (!dirty.current.paid) setPaid(String(item.paidAmount))
    setStatus(item.status)
    setDueDate(item.dueDate ?? '')
    if (!dirty.current.notes) setNotes(item.notes ?? '')
    if (!dirty.current.vendorUrl) setVendorUrl(item.vendorUrl ?? '')
    setCategoryId(item.categoryId)
  }, [item])

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  return (
    <div className="grid gap-5">
      <Field label="Label">
        <input
          value={label}
          onChange={(e) => {
            dirty.current.label = true
            setLabel(e.target.value)
          }}
          onBlur={() => {
            const next = label.trim() || item.label
            setLabel(next)
            dirty.current.label = false
            void persist({ label: next })
          }}
          className="field-input"
        />
      </Field>
      <Field label="Category">
        <select
          value={categoryId}
          onChange={(e) => {
            const next = e.target.value
            setCategoryId(next)
            void persist({ categoryId: next })
          }}
          className="field-input"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {GROUP_LABELS[c.group]} · {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Expected amount">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              dirty.current.amount = true
              setAmount(e.target.value)
            }}
            onBlur={() => {
              const n = parseMoneyInput(amount)
              setAmount(String(n))
              dirty.current.amount = false
              void persist({ amount: n })
            }}
            className="field-input"
          />
        </Field>
        <Field label="Paid so far">
          <input
            inputMode="decimal"
            value={paid}
            onChange={(e) => {
              dirty.current.paid = true
              setPaid(e.target.value)
            }}
            onBlur={() => {
              const n = parseMoneyInput(paid)
              setPaid(String(n))
              dirty.current.paid = false
              const patch: Partial<LineItem> = { paidAmount: n }
              if (n > 0 && status === 'planned') {
                patch.status =
                  n >= parseMoneyInput(amount) && parseMoneyInput(amount) > 0 ? 'paid' : 'partial'
                setStatus(patch.status)
              }
              void persist(patch)
            }}
            className="field-input"
          />
        </Field>
      </div>
      {item.status !== 'paid' ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[8rem] flex-1">
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
              Record payment
            </span>
            <input
              inputMode="decimal"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="Amount"
              className="field-input"
            />
          </label>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              const patch = await recordPaymentWithUndo(item, parseMoneyInput(payment))
              if (!patch) {
                showToast('Enter a payment amount')
                return
              }
              setPaid(String(patch.paidAmount))
              if (patch.status) setStatus(patch.status)
              setPayment('')
            }}
          >
            Add payment
          </button>
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as LineStatus
              setStatus(next)
              if (next === 'paid') {
                const n = parseMoneyInput(amount)
                const paidAmount = n > 0 ? n : parseMoneyInput(paid)
                setPaid(String(paidAmount))
                void persist({ status: next, paidAmount })
                return
              }
              void persist({ status: next })
            }}
            className="field-input"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const next = e.target.value
              setDueDate(next)
              void persist({ dueDate: next || undefined })
            }}
            className="field-input"
          />
        </Field>
      </div>
      <Field label="Vendor link">
        <input
          type="url"
          inputMode="url"
          value={vendorUrl}
          onChange={(e) => {
            dirty.current.vendorUrl = true
            setVendorUrl(e.target.value)
          }}
          onBlur={() => {
            dirty.current.vendorUrl = false
            const next = vendorUrl.trim()
            void persist({ vendorUrl: next || undefined })
          }}
          className="field-input"
          placeholder="https://…"
        />
      </Field>
      <Field label="Notes">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => {
            dirty.current.notes = true
            setNotes(e.target.value)
          }}
          onBlur={() => {
            dirty.current.notes = false
            void persist({ notes: notes.trim() || undefined })
          }}
          className="field-input resize-y"
          placeholder="Vendor contact, confirmation numbers…"
        />
      </Field>
      <ReceiptAssist
        item={item}
        onApplied={(patch) => {
          if (patch.paidAmount != null) setPaid(String(patch.paidAmount))
          if (patch.status) setStatus(patch.status)
          if (patch.dueDate !== undefined) setDueDate(patch.dueDate ?? '')
        }}
      />
    </div>
  )
}

function ReceiptAssist({
  item,
  onApplied,
}: {
  item: LineItem
  onApplied: (patch: Partial<LineItem>) => void
}) {
  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
    onApplied(patch)
  }

  return (
    <div className="rounded-sm border border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_70%,transparent)] px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        Receipt assist
      </p>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        No OCR — quick fills after you attach a receipt.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm"
          disabled={!(item.amount > 0) || item.status === 'paid'}
          onClick={async () => {
            const patch = { paidAmount: item.amount, status: 'paid' as const }
            await persist(patch)
            showToast('Paid set to expected')
          }}
        >
          Set paid to expected
        </button>
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm"
          onClick={async () => {
            const dueDate = todayKey()
            await persist({ dueDate })
            showToast('Due set to today')
          }}
        >
          Set due to today
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
