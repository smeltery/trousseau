import type { DragEvent } from 'react'
import { db } from '../../db/dexie'
import { dbWrite } from '../../lib/db-write'
import { showToast } from '../../lib/toast'

const DRAG_MIME = 'application/x-trousseau-line'

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
      const id = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain')
      if (!id) return
      void (async () => {
        const item = await db.lineItems.get(id)
        if (!item) return
        if (item.dueDate === dateKey) return
        await dbWrite(() => db.lineItems.update(id, { dueDate: dateKey }))
        showToast(`Moved to ${dateKey}`)
        onMoved?.()
      })()
    },
  }
}
