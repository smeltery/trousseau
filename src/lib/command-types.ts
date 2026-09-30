/** Simple fuzzy score: higher is better; 0 = no match. */
export function commandScore(
  query: string,
  label: string,
  keywords = '',
  snippet = '',
): number {
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const hay = `${label} ${keywords} ${snippet}`.toLowerCase()
  if (hay.includes(q)) return 100 - hay.indexOf(q) + (hay.startsWith(q) ? 20 : 0)
  let qi = 0
  let score = 0
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) {
      score += 2
      qi++
    }
  }
  return qi === q.length ? score : 0
}

export type CommandGroup =
  | 'Navigate'
  | 'Create'
  | 'Expenses'
  | 'Share & backup'
  | 'Calendar'

export type CommandItem = {
  id: string
  label: string
  hint?: string
  /** Brief secondary line (e.g. notes snippet). */
  snippet?: string
  group: CommandGroup
  keywords?: string
  run: () => void | Promise<void>
}

export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  return commands
    .map((c) => ({
      c,
      score: commandScore(query, c.label, c.keywords, c.snippet),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.label.localeCompare(b.c.label))
    .map((x) => x.c)
}

export const GROUP_ORDER: CommandGroup[] = [
  'Navigate',
  'Create',
  'Expenses',
  'Calendar',
  'Share & backup',
]
