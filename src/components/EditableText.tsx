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

/** Inline text that saves on blur; matches the fund-row editing pattern. */
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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  async function commit() {
    const next = draft.trim() || value
    setDraft(next)
    if (next === value) return
    await onSave(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 550)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!multiline && e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') {
      setDraft(value)
      e.currentTarget.blur()
    }
  }

  const shared = `editable-text min-w-0 bg-transparent outline-none placeholder:text-[var(--ink-faint)]${
    saved ? ' editable-saved' : ''
  }`

  if (multiline) {
    return (
      <textarea
        aria-label={ariaLabel}
        title="Click to edit"
        value={draft}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={onKeyDown}
        className={`${shared} w-full resize-y ${className}`}
        style={style}
      />
    )
  }

  return (
    <input
      aria-label={ariaLabel}
      title="Click to edit"
      value={draft}
      placeholder={placeholder}
      size={Math.max(draft.length, 1)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
      className={`${shared} w-auto max-w-full [field-sizing:content] ${className}`}
      style={style}
    />
  )
}
