import type { DragEvent } from 'react'
import { db } from '../../db/dexie'
import type { DueKind } from '../../lib/calendar-dues'
import { parseInstallmentKind } from '../../lib/calendar-dues'
import { dbWrite } from '../../lib/db-write'
import { showToast } from '../../lib/toast'

export const DRAG_MIME = 'application/x-trousseau-line'

export function encodeDragPayload(id: string, kind: DueKind): string {
  return `${id}|${kind}`
}

function parseDragPayload(raw: string): { id: string; kind: DueKind } | null {
  if (!raw) return null
  const pipe = raw.indexOf('|')
  if (pipe < 0) return null
  const id = raw.slice(0, pipe)
  const kindRaw = raw.slice(pipe + 1) as DueKind
  if (!id || !kindRaw) return null
  return { id, kind: kindRaw }
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
        const instId = parseInstallmentKind(kind)
        if (instId) {
          const list = item.installments ?? []
          const next = list.map((inst) => (inst.id === instId ? { ...inst, date: dateKey } : inst))
          if (!list.some((inst) => inst.id === instId)) return
          if (list.find((inst) => inst.id === instId)?.date === dateKey) return
          await dbWrite(() => db.lineItems.update(id, { installments: next }))
          showToast(`Moved installment to ${dateKey}`)
        } else if (kind === 'balance') {
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
