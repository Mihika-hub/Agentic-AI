// PATCH /api/sets { id, completed }  tick or untick one set of the logged-in user's workout.
import { sql } from './_lib/db.js'
import { HttpError, readBody, route } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'

export default route({
  async PATCH(req) {
    const userId = await requireUserId(req)
    const body = await readBody(req)
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Set is invalid.')
    if (typeof body.completed !== 'boolean') throw new HttpError(400, '"completed" must be true or false.')

    // The joins guarantee the set belongs to one of this user's unfinished workouts.
    const rows = await sql`
      UPDATE workout_sets s
      SET completed = ${body.completed},
          completed_at = CASE WHEN ${body.completed}::boolean THEN now() ELSE NULL END
      FROM workout_exercises we, workouts w
      WHERE s.id = ${id}
        AND we.id = s.workout_exercise_id
        AND w.id = we.workout_id
        AND w.user_id = ${userId}
        AND w.status <> 'completed'
      RETURNING s.id, s.completed, w.id AS workout_id, w.status`
    if (!rows.length) throw new HttpError(404, 'That set could not be updated. The workout may already be finished.')

    // Ticking a set on a planned workout starts it.
    if (rows[0].status === 'planned') {
      await sql`
        UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
        WHERE id = ${rows[0].workout_id} AND user_id = ${userId}`
    }
    return { set: { id: rows[0].id, completed: rows[0].completed } }
  },
})
