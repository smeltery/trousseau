export type ConfirmRequest = {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export type ChoiceRequest = {
  title: string
  body?: string
  primaryLabel: string
  secondaryLabel: string
  cancelLabel?: string
  primaryDanger?: boolean
  secondaryDanger?: boolean
}

type ConfirmListener = (request: ConfirmRequest | null) => void
type ChoiceListener = (request: ChoiceRequest | null) => void

let pending: ConfirmRequest | null = null
let resolvePending: ((ok: boolean) => void) | null = null
const confirmListeners = new Set<ConfirmListener>()

let choicePending: ChoiceRequest | null = null
let resolveChoice: ((value: 'primary' | 'secondary' | 'cancel') => void) | null = null
const choiceListeners = new Set<ChoiceListener>()

function emitConfirm() {
  for (const listener of confirmListeners) listener(pending)
}

function emitChoice() {
  for (const listener of choiceListeners) listener(choicePending)
}

export function subscribeConfirm(listener: ConfirmListener): () => void {
  confirmListeners.add(listener)
  listener(pending)
  return () => {
    confirmListeners.delete(listener)
  }
}

export function subscribeChoice(listener: ChoiceListener): () => void {
  choiceListeners.add(listener)
  listener(choicePending)
  return () => {
    choiceListeners.delete(listener)
  }
}

/** Quiet in-app confirm. Resolves true on confirm, false on cancel. */
export function askConfirm(request: ConfirmRequest): Promise<boolean> {
  if (resolvePending) {
    resolvePending(false)
    resolvePending = null
  }
  pending = request
  emitConfirm()
  return new Promise((resolve) => {
    resolvePending = resolve
  })
}

export function answerConfirm(ok: boolean): void {
  const resolve = resolvePending
  resolvePending = null
  pending = null
  emitConfirm()
  resolve?.(ok)
}

/** Three-way choice (keep mine / take theirs / cancel). */
export function askChoice(request: ChoiceRequest): Promise<'primary' | 'secondary' | 'cancel'> {
  if (resolveChoice) {
    resolveChoice('cancel')
    resolveChoice = null
  }
  choicePending = request
  emitChoice()
  return new Promise((resolve) => {
    resolveChoice = resolve
  })
}

export function answerChoice(value: 'primary' | 'secondary' | 'cancel'): void {
  const resolve = resolveChoice
  resolveChoice = null
  choicePending = null
  emitChoice()
  resolve?.(value)
}
