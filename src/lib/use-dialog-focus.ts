import { useEffect, type RefObject } from 'react'

/** Focus first focusable on open; restore previously focused element on close. */
export function useDialogFocus(containerRef: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = containerRef.current
    const focusable = root?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()
    return () => {
      previous?.focus()
    }
  }, [active, containerRef])
}
