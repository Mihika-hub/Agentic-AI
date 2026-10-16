import { sql } from './db.js'

// The user's "today" in their own time zone, as YYYY-MM-DD.
export async function getToday(tz) {
  const [{ today }] = await sql`SELECT (now() AT TIME ZONE ${tz})::date::text AS today`
  return today
}

// Today's workout for this user: the open (not completed) one if there is one,
// otherwise the most recently completed one. Returns null when there is none.
export async function getTodayWorkout(userId, tz) {
  const workouts = await sql`
    SELECT id, name, workout_date::text AS workout_date, status, duration_minutes, started_at, completed_at,
           CASE WHEN started_at IS NULL THEN 0
                ELSE GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(completed_at, now()) - started_at)))::int
           END AS elapsed_seconds
    FROM workouts
    WHERE user_id = ${userId} AND workout_date = (now() AT TIME ZONE ${tz})::date
    ORDER BY (status <> 'completed') DESC, id DESC
    LIMIT 1`
  if (!workouts.length) return null
  const w = workouts[0]

  const rows = await sql`
    SELECT we.id AS workout_exercise_id, we.order_index,
           e.id AS exercise_id, e.name, e.muscle_group, e.reps, e.difficulty, e.rest_seconds, e.description,
           s.id AS set_id, s.set_number, s.completed
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
    WHERE we.workout_id = ${w.id}
    ORDER BY we.order_index, we.id, s.set_number`

  const byId = new Map()
  for (const r of rows) {
    if (!byId.has(r.workout_exercise_id)) {
      byId.set(r.workout_exercise_id, {
        id: r.workout_exercise_id,
        exerciseId: r.exercise_id,
        name: r.name,
        muscleGroup: r.muscle_group,
        reps: r.reps,
        difficulty: r.difficulty,
        restSeconds: r.rest_seconds,
        description: r.description,
        sets: [],
      })
    }
    if (r.set_id) byId.get(r.workout_exercise_id).sets.push({ id: r.set_id, setNumber: r.set_number, completed: r.completed })
  }

  return {
    id: w.id,
    name: w.name,
    date: w.workout_date,
    status: w.status,
    durationMinutes: w.duration_minutes,
    startedAt: w.started_at,
    completedAt: w.completed_at,
    elapsedSeconds: w.elapsed_seconds,
    exercises: [...byId.values()],
  }
}

// Gives a workout a friendly name based on the muscle groups in it.
export async function renameWorkout(workoutId) {
  const rows = await sql`
    SELECT e.muscle_group, min(we.order_index) AS first
    FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
    WHERE we.workout_id = ${workoutId}
    GROUP BY e.muscle_group ORDER BY first`
  const groups = rows.map((r) => r.muscle_group)
  let name = "Today's Workout"
  if (groups.length === 1) name = groups[0] === 'Cardio' ? 'Cardio Conditioning' : `${groups[0]} Day`
  else if (groups.length === 2) name = `${groups[0]} & ${groups[1]}`
  else if (groups.length >= 3) name = 'Full Body Session'
  await sql`UPDATE workouts SET name = ${name} WHERE id = ${workoutId}`
}
