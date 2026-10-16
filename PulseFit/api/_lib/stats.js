import { sql } from './db.js'

const dayNumber = (isoDate) => Math.round(Date.parse(`${isoDate}T00:00:00Z`) / 86400000)

// Pure streak maths, easy to test with fixed dates.
// dates: workout days as "YYYY-MM-DD" (any order, duplicates allowed). today: "YYYY-MM-DD".
// current: consecutive days ending today, or ending yesterday if today has no workout yet.
// best: the longest run of consecutive days ever. Future dates are ignored.
export function computeStreaks(dates, today) {
  const todayNum = dayNumber(today)
  const days = [...new Set(dates.map(dayNumber))].filter((d) => Number.isFinite(d) && d <= todayNum).sort((a, b) => b - a)

  let current = 0
  if (days.length && todayNum - days[0] <= 1) {
    current = 1
    for (let i = 1; i < days.length && days[i - 1] - days[i] === 1; i++) current++
  }

  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i - 1] - days[i] === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return { current, best }
}

export async function getStreaks(userId, tz) {
  const [rows, [{ today }]] = await Promise.all([
    sql`
      SELECT DISTINCT workout_date::text AS d
      FROM workouts
      WHERE user_id = ${userId} AND status = 'completed'`,
    sql`SELECT (now() AT TIME ZONE ${tz})::date::text AS today`,
  ])
  return computeStreaks(
    rows.map((r) => r.d),
    today,
  )
}
