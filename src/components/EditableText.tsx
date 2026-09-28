import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'

interface EditableTextProps {
  value: string
  onSave: (next: string) => void | Promise<void>
  className?: string
  style?: CSSProperties
  multiline?: boolean
  placeholder?: string
  'aria-label'?: string
}

/** Inline text that saves on blur — matches the fund-row editing pattern. */
export function EditableText({
  value,
  onSave,
  className = '',
  style,
  multiline = false,
  placeholder,
  'aria-label': ariaLabel,
}: EditableTextProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  async function commit() {
    const next = draft.trim() || value
    setDraft(next)
    if (next !== value) await onSave(next)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!multiline && e.key === 'Enter') {
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      e.currentTarget.blur()
    }
  }

  const shared =
    'w-full min-w-0 bg-transparent outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:text-[var(--accent-deep)]'

  if (multiline) {
    return (
      <textarea
        aria-label={ariaLabel}
        value={draft}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={onKeyDown}
        className={`${shared} resize-y ${className}`}
        style={style}
      />
    )
  }

  return (
    <input
      aria-label={ariaLabel}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
      className={`${shared} ${className}`}
      style={style}
    />
  )
}
