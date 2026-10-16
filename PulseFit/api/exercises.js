// GET /api/exercises?muscleGroup=Chest   (muscleGroup is optional)
import { sql } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default route({
  async GET(req) {
    await requireUserId(req)
    const group = req.query?.muscleGroup
    if (group && group !== 'All' && !GROUPS.includes(group)) throw new HttpError(400, 'Unknown muscle group.')

    const rows =
      group && group !== 'All'
        ? await sql`
            SELECT id, name, muscle_group, sets, reps, difficulty, rest_seconds, description
            FROM exercises WHERE muscle_group = ${group} ORDER BY id`
        : await sql`
            SELECT id, name, muscle_group, sets, reps, difficulty, rest_seconds, description
            FROM exercises ORDER BY id`

    return {
      muscleGroups: GROUPS,
      exercises: rows.map((r) => ({
        id: r.id,
        name: r.name,
        muscleGroup: r.muscle_group,
        sets: r.sets,
        reps: r.reps,
        difficulty: r.difficulty,
        restSeconds: r.rest_seconds,
        description: r.description,
      })),
    }
  },
})
