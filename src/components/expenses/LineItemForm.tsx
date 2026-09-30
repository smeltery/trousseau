import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { Category, LineItem, LineStatus } from '../../db/types'
import { GROUP_LABELS, STATUS_LABELS } from '../../lib/budget'
import { dbWrite } from '../../lib/db-write'
import { parseMoneyInput } from '../../lib/money'
import { LineItemDuesSection } from './line-item-dues'
import { LineItemField } from './line-item-field'
import { LineItemPaymentSection } from './line-item-payments'
import { LineItemReceiptAssist } from './line-item-receipt'
import { LineItemReimburseSection } from './line-item-reimburse'

const STATUSES: LineStatus[] = ['planned', 'deposit', 'partial', 'paid']

export function LineItemForm({ item }: { item: LineItem }) {
  const categories =
    useLiveQuery(() => db.categories.orderBy('sort').toArray(), []) ?? ([] as Category[])
  const category = categories.find((c) => c.id === item.categoryId)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [paid, setPaid] = useState(String(item.paidAmount))
  const [status, setStatus] = useState(item.status)
  const [dueDate, setDueDate] = useState(item.dueDate ?? '')
  const [balanceDue, setBalanceDue] = useState(item.remainingBalanceDueDate ?? '')
  const [dueOffset, setDueOffset] = useState(
    item.dueOffsetDays != null ? String(item.dueOffsetDays) : '',
  )
  const [balanceOffset, setBalanceOffset] = useState(
    item.balanceOffsetDays != null ? String(item.balanceOffsetDays) : '',
  )
  const [expectedBack, setExpectedBack] = useState(item.expectedBackDate ?? '')
  const [backReceived, setBackReceived] = useState(Boolean(item.backReceived))
  const [notes, setNotes] = useState(item.notes ?? '')
  const [vendorUrl, setVendorUrl] = useState(item.vendorUrl ?? '')
  const [categoryId, setCategoryId] = useState(item.categoryId)
  const dirty = useRef({ label: false, amount: false, paid: false, notes: false, vendorUrl: false })

  useEffect(() => {
    if (!dirty.current.label) setLabel(item.label)
    if (!dirty.current.amount) setAmount(String(item.amount))
    if (!dirty.current.paid) setPaid(String(item.paidAmount))
    setStatus(item.status)
    setDueDate(item.dueDate ?? '')
    setBalanceDue(item.remainingBalanceDueDate ?? '')
    setDueOffset(item.dueOffsetDays != null ? String(item.dueOffsetDays) : '')
    setBalanceOffset(item.balanceOffsetDays != null ? String(item.balanceOffsetDays) : '')
    setExpectedBack(item.expectedBackDate ?? '')
    setBackReceived(Boolean(item.backReceived))
    if (!dirty.current.notes) setNotes(item.notes ?? '')
    if (!dirty.current.vendorUrl) setVendorUrl(item.vendorUrl ?? '')
    setCategoryId(item.categoryId)
  }, [item])

  async function persist(patch: Partial<LineItem>) {
    await dbWrite(() => db.lineItems.update(item.id, patch))
  }

  return (
    <div className="grid gap-5">
      <LineItemField label="Label">
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
      </LineItemField>
      <LineItemField label="Category">
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
      </LineItemField>
      <div className="grid gap-5 sm:grid-cols-2">
        <LineItemField label="Expected amount">
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
        </LineItemField>
        <LineItemField label="Paid so far">
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
        </LineItemField>
      </div>
      <LineItemPaymentSection
        item={item}
        onApplied={(patch) => {
          if (patch.paidAmount != null) setPaid(String(patch.paidAmount))
          if (patch.status) setStatus(patch.status)
        }}
      />
      <LineItemField label="Status">
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
      </LineItemField>
      <LineItemDuesSection
        item={item}
        dueDate={dueDate}
        balanceDue={balanceDue}
        dueOffset={dueOffset}
        balanceOffset={balanceOffset}
        onDueDate={setDueDate}
        onBalanceDue={setBalanceDue}
        onDueOffset={setDueOffset}
        onBalanceOffset={setBalanceOffset}
      />
      {category?.group === 'reimbursement' ? (
        <LineItemReimburseSection
          item={item}
          expectedBack={expectedBack}
          backReceived={backReceived}
          onExpectedBack={setExpectedBack}
          onBackReceived={setBackReceived}
        />
      ) : null}
      <LineItemField label="Vendor link">
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
      </LineItemField>
      <LineItemField label="Notes">
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
      </LineItemField>
      <LineItemReceiptAssist
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
