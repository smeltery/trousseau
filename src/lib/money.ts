const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const precise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(centsOrDollars: number, { cents = false } = {}): string {
  const value = cents ? centsOrDollars / 100 : centsOrDollars
  if (Number.isInteger(value)) return formatter.format(value)
  return precise.format(value)
}

export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

export function sum(amounts: number[]): number {
  return amounts.reduce((acc, n) => acc + n, 0)
}
