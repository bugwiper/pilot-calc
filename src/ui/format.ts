const MINUS = '−'

/** 4,647 — whole feet with thousands separator and a real minus sign. */
export function fmtInt(n: number): string {
  const r = Math.round(n)
  return (r < 0 ? MINUS : '') + Math.abs(r).toLocaleString('en-US')
}

/** +12 / −354 — signed whole number. */
export function fmtSigned(n: number): string {
  const r = Math.round(n)
  if (r === 0) return '0'
  return (r < 0 ? MINUS : '+') + Math.abs(r).toLocaleString('en-US')
}

export function fmtDec(n: number, decimals = 1): string {
  const s = Math.abs(n).toFixed(decimals)
  return (Number(s) !== 0 && n < 0 ? MINUS : '') + s
}
