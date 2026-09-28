export type ConfirmRequest = {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type Listener = (request: ConfirmRequest | null) => void

let pending: ConfirmRequest | null = null
let resolvePending: ((ok: boolean) => void) | null = null
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(pending)
}

export function subscribeConfirm(listener: Listener): () => void {
  listeners.add(listener)
  listener(pending)
  return () => {
    listeners.delete(listener)
  }
}

/** Quiet in-app confirm. Resolves true on confirm, false on cancel. */
export function askConfirm(request: ConfirmRequest): Promise<boolean> {
  if (resolvePending) {
    resolvePending(false)
    resolvePending = null
  }
  pending = request
  emit()
  return new Promise((resolve) => {
    resolvePending = resolve
  })
}

export function answerConfirm(ok: boolean): void {
  const resolve = resolvePending
  resolvePending = null
  pending = null
  emit()
  resolve?.(ok)
}
