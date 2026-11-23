// Shared number-input helpers.

export function parseNum(text: string): number | null {
  const t = text.trim().replace(',', '.').replace(/[−–]/g, '-')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function formatField(n: number | null, decimals = 1): string {
  if (n === null) return ''
  const s = n.toFixed(decimals)
  return String(Number(s)) // strips trailing zeros, "-0" → "0"
}
