// Fraction of a progress ring to fill: always a number from 0 to 1, never NaN.
export function ringProgress(value, max) {
  const v = Number(value)
  const m = Number(max)
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return 0
  return Math.min(1, Math.max(0, v / m))
}

// A display-safe whole number (NaN, Infinity and negatives become 0).
export function safeCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}
