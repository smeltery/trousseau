type Toast = { id: string; message: string }

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(toasts)
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => {
    listeners.delete(listener)
  }
}

export function showToast(message: string): void {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message }]
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 2800)
}
