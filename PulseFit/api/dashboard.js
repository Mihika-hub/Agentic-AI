// GET /api/dashboard  everything the dashboard needs for the logged-in user.
import { sql, getTimeZone } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'
import { getTodayWorkout } from './_lib/workouts.js'
import { getStreaks } from './_lib/stats.js'

export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    const tz = getTimeZone(req)

    const [users, activity, week, nextClass, todayWorkout, streak] = await Promise.all([
      sql`SELECT full_name, weekly_goal_workouts, weekly_goal_minutes FROM users WHERE id = ${userId}`,
      // Active minutes per day for the last 7 days (oldest first, today last), plus the 7 days before.
      sql`
        WITH today AS (SELECT (now() AT TIME ZONE ${tz})::date AS d),
        days AS (
          SELECT generate_series((SELECT d FROM today) - 13, (SELECT d FROM today), interval '1 day')::date AS d
        )
        SELECT days.d::text AS date, trim(to_char(days.d, 'Dy')) AS day,
               COALESCE(sum(w.duration_minutes), 0)::int AS minutes,
               (days.d > (SELECT d FROM today) - 7) AS recent
        FROM days
        LEFT JOIN workouts w
          ON w.user_id = ${userId} AND w.status = 'completed' AND w.workout_date = days.d
        GROUP BY days.d ORDER BY days.d`,
      // This calendar week (Monday start) in the user's time zone.
      sql`
        WITH bounds AS (SELECT date_trunc('week', (now() AT TIME ZONE ${tz}))::date AS start)
        SELECT gs::date::text AS date,
               EXISTS (SELECT 1 FROM workouts w
                       WHERE w.user_id = ${userId} AND w.status = 'completed' AND w.workout_date = gs::date) AS trained,
               (SELECT count(*)::int FROM workouts w
                 WHERE w.user_id = ${userId} AND w.status = 'completed' AND w.workout_date = gs::date) AS workouts,
               (SELECT COALESCE(sum(duration_minutes), 0)::int FROM workouts w
                 WHERE w.user_id = ${userId} AND w.status = 'completed' AND w.workout_date = gs::date) AS minutes
        FROM bounds, generate_series(bounds.start, bounds.start + 6, interval '1 day') AS gs
        ORDER BY gs`,
      sql`
        SELECT id, title, coach_name, start_time, duration_minutes, capacity, intensity
        FROM classes WHERE start_time > now() ORDER BY start_time LIMIT 1`,
      getTodayWorkout(userId, tz),
      getStreaks(userId, tz),
    ])
    if (!users.length) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
    const user = users[0]

    const last7 = activity.filter((d) => d.recent)
    const prev7 = activity.filter((d) => !d.recent)
    const minutesLast7 = last7.reduce((a, d) => a + d.minutes, 0)
    const minutesPrev7 = prev7.reduce((a, d) => a + d.minutes, 0)
    const changePct = minutesPrev7 > 0 ? Math.round(((minutesLast7 - minutesPrev7) / minutesPrev7) * 100) : null

    const weekWorkouts = week.reduce((a, d) => a + d.workouts, 0)
    const weekMinutes = week.reduce((a, d) => a + d.minutes, 0)
    const goals = [
      weekWorkouts >= user.weekly_goal_workouts,
      weekMinutes >= user.weekly_goal_minutes,
    ]

    return {
      user: { fullName: user.full_name },
      todayWorkout,
      activity: last7.map(({ date, day, minutes }) => ({ date, day, minutes })),
      activityChangePct: changePct,
      week: week.map(({ date, trained }) => ({ date, trained })),
      streak,
      rings: [
        { key: 'workouts', label: 'Workouts', value: weekWorkouts, goal: user.weekly_goal_workouts, color: '#C6FF3D' },
        { key: 'minutes', label: 'Active min', value: weekMinutes, goal: user.weekly_goal_minutes, color: '#22E4FF' },
        { key: 'goals', label: 'Goals hit', value: goals.filter(Boolean).length, goal: goals.length, color: '#FF6B4A' },
      ],
      nextClass: nextClass[0]
        ? {
            id: nextClass[0].id,
            title: nextClass[0].title,
            coachName: nextClass[0].coach_name,
            startTime: nextClass[0].start_time,
            durationMinutes: nextClass[0].duration_minutes,
            capacity: nextClass[0].capacity,
            intensity: nextClass[0].intensity,
          }
        : null,
    }
  },
})
