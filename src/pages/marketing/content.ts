export const features = [
  {
    title: 'Yours to rename',
    body: 'Names, section titles, categories, and every dollar. Edit in place until it feels like your wedding.',
  },
  {
    title: 'One link, both of you',
    body: 'No accounts. A secret share URL keeps the same budget in sync on phone and laptop — treat it like a password.',
  },
  {
    title: 'Receipts and notes',
    body: 'Open any expense to attach PDFs, photos, or Drive links, and keep vendor notes next to the amount.',
  },
] as const

export const tracks = [
  {
    label: 'Gifts and savings',
    body: 'Log what came in, what you set aside, and watch the pool grow before the first vendor invoice.',
  },
  {
    label: 'Vendor lines',
    body: 'Venue, florals, travel, or your own categories. Paid and due sit next to each other so nothing drifts.',
  },
  {
    label: 'Paper trails',
    body: 'Attach receipts and keep short notes on the same line as the dollar amount.',
  },
] as const

export const steps = [
  {
    n: '01',
    title: 'Start blank or try the demo',
    body: 'Open a tracker — Trousseau creates a share link you can send to your partner.',
  },
  {
    n: '02',
    title: 'Add gifts and expenses',
    body: 'Build categories that match how you actually spend. Edits sync on the share link.',
  },
  {
    n: '03',
    title: 'Export when you want a zip',
    body: 'Download a backup anytime, or import a zip to start a fresh shared budget.',
  },
] as const

export const customs = [
  {
    title: 'Your names on the hero',
    body: 'Click any title and type. The page becomes yours without a settings maze.',
  },
  {
    title: 'Categories that match the day',
    body: 'Rename groups, add lines, and drop what you do not need. No fixed template.',
  },
  {
    title: 'Copy that fits your tone',
    body: 'Eyebrows, section labels, and empty states stay editable so the app reads like your wedding.',
  },
] as const

export const faqs = [
  {
    q: 'Do we need accounts?',
    a: 'No. Trousseau uses a secret share link instead of logins. Anyone with the URL can edit — don’t post it publicly.',
  },
  {
    q: 'What happens if we clear the browser?',
    a: 'The share link still opens your budget from the cloud. Export a zip if you also want an offline archive.',
  },
  {
    q: 'Can we start from a sample?',
    a: 'Yes. Try the filled demo, or open Import to drop a Trousseau .zip (including the sample wedding download). Import creates a new share link.',
  },
] as const

export type FooterLink =
  | { label: string; to: string }
  | { label: string; href: string; download?: string }

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Start blank', to: '/app?new=1' },
      { label: 'Try demo', to: '/app?demo=1' },
      { label: 'Import backup', to: '/app?import=1' },
      { label: 'Open tracker', to: '/app' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'How it works', to: '/#how' },
      { label: 'Privacy', to: '/#privacy' },
      { label: 'Backup', to: '/#backup' },
      { label: 'Questions', to: '/#questions' },
    ],
  },
  {
    title: 'Samples',
    links: [
      {
        label: 'Sample wedding budget',
        href: '/samples/sample-wedding.zip',
        download: 'sample-wedding.zip',
      },
    ],
  },
]
