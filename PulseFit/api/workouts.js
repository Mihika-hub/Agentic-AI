// GET    /api/workouts                   today's workout with exercises and sets
// POST   /api/workouts  { exerciseId }   add an exercise to today's workout
// DELETE /api/workouts?exerciseId=12     remove an exercise from today's workout
// PATCH  /api/workouts  { id, action }   action: "start" | "finish" | "restart"
import { sql, getTimeZone } from './_lib/db.js'
import { HttpError, readBody, route } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'
import { getToday, getTodayWorkout, renameWorkout } from './_lib/workouts.js'
import { getStreaks } from './_lib/stats.js'

function positiveInt(value, label) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${label} is invalid.`)
  return n
}

async function openWorkoutId(userId, today) {
  const rows = await sql`
    SELECT id FROM workouts
    WHERE user_id = ${userId} AND workout_date = ${today} AND status <> 'completed'
    LIMIT 1`
  return rows[0]?.id ?? null
}

export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    return { workout: await getTodayWorkout(userId, getTimeZone(req)) }
  },

  async POST(req) {
    const userId = await requireUserId(req)
    const tz = getTimeZone(req)
    const { exerciseId: rawId } = await readBody(req)
    const exerciseId = positiveInt(rawId, 'Exercise')

    const exercise = await sql`SELECT id, name, sets FROM exercises WHERE id = ${exerciseId}`
    if (!exercise.length) throw new HttpError(404, 'That exercise no longer exists.')

    const today = await getToday(tz)
    // At most one open workout per user per day (enforced by a partial unique index).
    await sql`
      INSERT INTO workouts (user_id, name, workout_date)
      VALUES (${userId}, 'Today''s Workout', ${today})
      ON CONFLICT (user_id, workout_date) WHERE status <> 'completed' DO NOTHING`
    const workoutId = await openWorkoutId(userId, today)

    // Add the exercise and its sets in one statement; does nothing if it is already there.
    await sql`
      WITH ex AS (SELECT id, sets FROM exercises WHERE id = ${exerciseId}),
      we AS (
        INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
        SELECT ${workoutId}, ex.id,
               COALESCE((SELECT max(order_index) + 1 FROM workout_exercises WHERE workout_id = ${workoutId}), 0)
        FROM ex
        ON CONFLICT (workout_id, exercise_id) DO NOTHING
        RETURNING id
      )
      INSERT INTO workout_sets (workout_exercise_id, set_number)
      SELECT we.id, gs FROM we, ex, generate_series(1, ex.sets) AS gs`
    await renameWorkout(workoutId)

    return { workout: await getTodayWorkout(userId, tz) }
  },

  async DELETE(req) {
    const userId = await requireUserId(req)
    const tz = getTimeZone(req)
    const exerciseId = positiveInt(req.query?.exerciseId, 'Exercise')
    const workoutId = await openWorkoutId(userId, await getToday(tz))
    if (workoutId) {
      await sql`DELETE FROM workout_exercises WHERE workout_id = ${workoutId} AND exercise_id = ${exerciseId}`
      await renameWorkout(workoutId)
    }
    return { workout: await getTodayWorkout(userId, tz) }
  },

  async PATCH(req) {
    const userId = await requireUserId(req)
    const tz = getTimeZone(req)
    const body = await readBody(req)
    const id = positiveInt(body.id, 'Workout')
    const action = String(body.action || '')

    const owned = await sql`SELECT id, status FROM workouts WHERE id = ${id} AND user_id = ${userId}`
    if (!owned.length) throw new HttpError(404, 'Workout not found.')
    const { status } = owned[0]

    if (action === 'start') {
      await sql`
        UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
        WHERE id = ${id} AND user_id = ${userId} AND status = 'planned'`
    } else if (action === 'finish') {
      if (status === 'completed') throw new HttpError(409, 'This workout is already finished.')
      const done = await sql`
        SELECT count(*)::int AS n FROM workout_sets s
        JOIN workout_exercises we ON we.id = s.workout_exercise_id
        WHERE we.workout_id = ${id} AND s.completed`
      if (!done[0].n) throw new HttpError(400, 'Tick at least one set before finishing.')
      await sql`
        UPDATE workouts SET
          status = 'completed',
          completed_at = now(),
          started_at = COALESCE(started_at, now()),
          duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(started_at, now()))) / 60))::int
        WHERE id = ${id} AND user_id = ${userId}`
    } else if (action === 'restart') {
      if (status === 'completed') throw new HttpError(409, 'Finished workouts cannot be restarted.')
      await sql`
        UPDATE workout_sets s SET completed = false, completed_at = NULL
        FROM workout_exercises we
        WHERE we.id = s.workout_exercise_id AND we.workout_id = ${id}`
      await sql`
        UPDATE workouts SET status = 'in_progress', started_at = now()
        WHERE id = ${id} AND user_id = ${userId}`
    } else {
      throw new HttpError(400, 'Unknown action.')
    }

    const workout = await getTodayWorkout(userId, tz)
    const streak = action === 'finish' ? await getStreaks(userId, tz) : undefined
    return { workout, streak }
  },
})
