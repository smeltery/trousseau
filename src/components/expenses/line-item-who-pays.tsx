import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/dexie'
import type { WhoPays } from '../../db/types'
import { parseMoneyInput } from '../../lib/money'
import { DEFAULT_SITE, parseSiteSettings, SITE_META_KEY } from '../../lib/site-settings'
import { LineItemField } from './line-item-field'

export function LineItemWhoPaysField({
  value,
  leftAmount,
  rightAmount,
  onPersist,
  onPersistSplit,
}: {
  value: WhoPays | ''
  leftAmount?: number
  rightAmount?: number
  onPersist: (next: WhoPays | undefined) => void
  onPersistSplit: (left: number | undefined, right: number | undefined) => void
}) {
  const siteMeta = useLiveQuery(() => db.meta.get(SITE_META_KEY), [])
  const site = parseSiteSettings(siteMeta?.value) ?? DEFAULT_SITE
  const [left, setLeft] = useState(leftAmount != null ? String(leftAmount) : '')
  const [right, setRight] = useState(rightAmount != null ? String(rightAmount) : '')
  const [splitOpen, setSplitOpen] = useState(
    leftAmount != null || rightAmount != null,
  )

  return (
    <div className="grid gap-3">
      <LineItemField label="Who pays">
        <select
          value={value}
          onChange={(e) => {
            const next = e.target.value as WhoPays | ''
            onPersist(next || undefined)
          }}
          className="field-input"
        >
          <option value="">Unset</option>
          <option value="joint">Joint</option>
          <option value="left">{site.brandLeft}</option>
          <option value="right">{site.brandRight}</option>
        </select>
      </LineItemField>
      <button
        type="button"
        className="justify-self-start text-xs font-semibold tracking-wide text-[var(--accent-deep)] hover:underline"
        onClick={() => setSplitOpen((v) => !v)}
        aria-expanded={splitOpen}
      >
        {splitOpen ? 'Hide dollar split' : 'Set dollar split'}
      </button>
      {splitOpen ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <LineItemField label={`${site.brandLeft} $`}>
            <input
              inputMode="decimal"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              onBlur={() => {
                const l = left.trim() ? parseMoneyInput(left) : undefined
                const r = right.trim() ? parseMoneyInput(right) : undefined
                setLeft(l != null ? String(l) : '')
                onPersistSplit(l, r)
              }}
              className="field-input"
              placeholder="0"
            />
          </LineItemField>
          <LineItemField label={`${site.brandRight} $`}>
            <input
              inputMode="decimal"
              value={right}
              onChange={(e) => setRight(e.target.value)}
              onBlur={() => {
                const l = left.trim() ? parseMoneyInput(left) : undefined
                const r = right.trim() ? parseMoneyInput(right) : undefined
                setRight(r != null ? String(r) : '')
                onPersistSplit(l, r)
              }}
              className="field-input"
              placeholder="0"
            />
          </LineItemField>
        </div>
      ) : null}
    </div>
  )
}
