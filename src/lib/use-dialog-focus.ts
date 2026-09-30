import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
  )
}

/** Focus first focusable on open; trap Tab; lock body scroll; restore focus on close. */
export function useDialogFocus(containerRef: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = containerRef.current
    const focusable = root ? focusablesIn(root)[0] : null
    focusable?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !root) return
      const nodes = focusablesIn(root)
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      const current = document.activeElement
      if (e.shiftKey) {
        if (current === first || !root.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else if (current === last || !root.contains(current)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [active, containerRef])
}
