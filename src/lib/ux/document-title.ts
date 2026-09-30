const DEFAULT = 'Trousseau · Wedding budget, shared with you'

/** Couple-aware tab title from site brand names. */
export function coupleDocumentTitle(brandLeft: string, brandRight: string): string {
  const left = brandLeft.trim()
  const right = brandRight.trim()
  const blank =
    (!left || left === 'Groom') && (!right || right === 'Bride')
  if (blank) return DEFAULT
  return `${left} & ${right} · Trousseau`
}

export function applyDocumentTitle(brandLeft: string, brandRight: string): void {
  document.title = coupleDocumentTitle(brandLeft, brandRight)
}
