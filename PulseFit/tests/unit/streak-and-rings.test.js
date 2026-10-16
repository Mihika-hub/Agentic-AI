import { describe, expect, it } from 'vitest'
import { computeStreaks } from '../../api/_lib/stats.js'
import { ringProgress, safeCount } from '../../src/lib/ring.js'

describe('computeStreaks with fixed (fake) dates', () => {
  const today = '2026-03-10'

  it('no workouts: streak 0', () => {
    expect(computeStreaks([], today)).toEqual({ current: 0, best: 0 })
  })

  it('3 days in a row ending today: streak 3', () => {
    expect(computeStreaks(['2026-03-08', '2026-03-09', '2026-03-10'], today)).toEqual({ current: 3, best: 3 })
  })

  it('a missed day resets the streak', () => {
    expect(computeStreaks(['2026-03-05', '2026-03-06', '2026-03-07', '2026-03-09', '2026-03-10'], today)).toEqual({ current: 2, best: 3 })
    expect(computeStreaks(['2026-03-06', '2026-03-07', '2026-03-08'], today)).toEqual({ current: 0, best: 3 })
  })

  it('a workout today plus yesterday: streak 2', () => {
    expect(computeStreaks(['2026-03-10', '2026-03-09'], today)).toEqual({ current: 2, best: 2 })
  })

  it('yesterday only still counts as an active streak', () => {
    expect(computeStreaks(['2026-03-09'], today)).toEqual({ current: 1, best: 1 })
  })

  it('handles duplicates, any order, and ignores future dates', () => {
    expect(computeStreaks(['2026-03-10', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12'], today)).toEqual({ current: 2, best: 2 })
  })

  it('works across month and year boundaries', () => {
    expect(computeStreaks(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01')).toEqual({ current: 3, best: 3 })
    expect(computeStreaks(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01').current).toBe(3)
  })

  it('works across a daylight-saving change', () => {
    expect(computeStreaks(['2026-03-28', '2026-03-29', '2026-03-30'], '2026-03-30').current).toBe(3)
    expect(computeStreaks(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26').current).toBe(3)
  })
})

describe('progress rings never exceed 100% and never show NaN', () => {
  it.each([
    [0, 5, 0],
    [2, 4, 0.5],
    [5, 5, 1],
    [9, 5, 1],
    [-3, 5, 0],
    [3, 0, 0],
    [3, -2, 0],
    [NaN, 5, 0],
    [3, NaN, 0],
    [undefined, undefined, 0],
    [null, 4, 0],
    [Infinity, 4, 0],
    ['2', '4', 0.5],
  ])('ringProgress(%s, %s) = %s', (value, max, expected) => {
    const p = ringProgress(value, max)
    expect(p).toBe(expected)
    expect(Number.isNaN(p)).toBe(false)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThanOrEqual(1)
  })

  it('safeCount turns bad numbers into 0', () => {
    expect(safeCount(NaN)).toBe(0)
    expect(safeCount(undefined)).toBe(0)
    expect(safeCount(-4)).toBe(0)
    expect(safeCount(Infinity)).toBe(0)
    expect(safeCount(41.6)).toBe(42)
  })
})
