import type { DragEvent } from 'react'
import { db } from '../../db/dexie'
import type { DueKind } from '../../lib/calendar-dues'
import { dbWrite } from '../../lib/db-write'
import { showToast } from '../../lib/toast'

export const DRAG_MIME = 'application/x-trousseau-line'

export function encodeDragPayload(id: string, kind: DueKind): string {
  return `${id}|${kind}`
}

function parseDragPayload(raw: string): { id: string; kind: DueKind } | null {
  if (!raw) return null
  const [id, kindRaw] = raw.split('|')
  if (!id) return null
  const kind: DueKind = kindRaw === 'balance' ? 'balance' : 'deposit'
  return { id, kind }
}

/** Shared drop-target handlers for calendar day cells. */
export function dayDropProps(dateKey: string, onMoved?: () => void) {
  return {
    onDragOver: (e: DragEvent) => {
      if (![DRAG_MIME, 'text/plain'].some((t) => e.dataTransfer.types.includes(t))) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain')
      const parsed = parseDragPayload(raw)
      if (!parsed) return
      const { id, kind } = parsed
      void (async () => {
        const item = await db.lineItems.get(id)
        if (!item) return
        if (kind === 'balance') {
          if (item.remainingBalanceDueDate === dateKey) return
          await dbWrite(() =>
            db.lineItems.update(id, {
              remainingBalanceDueDate: dateKey,
              balanceOffsetDays: undefined,
            }),
          )
          showToast(`Moved balance to ${dateKey}`)
        } else {
          if (item.dueDate === dateKey) return
          await dbWrite(() =>
            db.lineItems.update(id, { dueDate: dateKey, dueOffsetDays: undefined }),
          )
          showToast(`Moved deposit to ${dateKey}`)
        }
        onMoved?.()
      })()
    },
  }
}
