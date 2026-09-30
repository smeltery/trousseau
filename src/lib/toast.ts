type ToastAction = { label: string; onClick: () => void }

type Toast = {
  id: string
  message: string
  action?: ToastAction
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners = new Set<Listener>()
const timers = new Map<string, number>()

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

export function dismissToast(id: string): void {
  const timer = timers.get(id)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function showToast(
  message: string,
  opts?: { action?: ToastAction; durationMs?: number },
): string {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message, action: opts?.action }]
  emit()
  const duration = opts?.durationMs ?? (opts?.action ? 5600 : 2800)
  const timer = window.setTimeout(() => dismissToast(id), duration)
  timers.set(id, timer)
  return id
}
