import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTestUsers, del, get, patch, post, signedUpAgent, sql } from './helpers.js'

afterAll(cleanupTestUsers)

async function exerciseByName(name) {
  const [row] = await sql`SELECT id, sets, rest_seconds FROM exercises WHERE name = ${name}`
  return row
}

describe('/api/workouts and /api/sets: full workout lifecycle', () => {
  it('starts with no workout today', async () => {
    const { agent } = await signedUpAgent()
    const res = await get(agent, '/api/workouts')
    expect(res.status).toBe(200)
    expect(res.body.workout).toBeNull()
  })

  it('creates today\'s workout when the first exercise is added, with one row per set', async () => {
    const { agent } = await signedUpAgent()
    const plank = await exerciseByName('Plank Hold')
    const res = await post(agent, '/api/workouts', { exerciseId: plank.id })
    expect(res.status).toBe(200)
    const w = res.body.workout
    expect(w.status).toBe('planned')
    expect(w.name).toBe('Core Day')
    expect(w.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(w.exercises).toHaveLength(1)
    expect(w.exercises[0]).toMatchObject({ exerciseId: plank.id, restSeconds: plank.rest_seconds })
    expect(w.exercises[0].sets.map((s) => s.setNumber)).toEqual(Array.from({ length: plank.sets }, (_, i) => i + 1))
    expect(w.exercises[0].sets.every((s) => s.completed === false)).toBe(true)
  })

  it('adds more exercises to the same workout, keeps order, ignores duplicates and renames it', async () => {
    const { agent } = await signedUpAgent()
    const bench = await exerciseByName('Barbell Bench Press')
    const row = await exerciseByName('Seated Cable Row')
    const first = (await post(agent, '/api/workouts', { exerciseId: bench.id })).body.workout
    await post(agent, '/api/workouts', { exerciseId: row.id })
    const dup = await post(agent, '/api/workouts', { exerciseId: bench.id })
    expect(dup.status).toBe(200)
    const w = dup.body.workout
    expect(w.id).toBe(first.id)
    expect(w.exercises.map((e) => e.exerciseId)).toEqual([bench.id, row.id])
    expect(w.exercises[0].sets).toHaveLength(bench.sets)
    expect(w.name).toBe('Chest & Back')
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM workouts WHERE user_id = (SELECT user_id FROM workouts WHERE id = ${w.id})`
    expect(n).toBe(1)
  })

  it('handles many quick adds at once without creating two workouts', async () => {
    const { agent } = await signedUpAgent()
    const ids = (await sql`SELECT id FROM exercises WHERE muscle_group = 'Legs' ORDER BY id`).map((r) => r.id)
    const results = await Promise.all(ids.map((id) => post(agent, '/api/workouts', { exerciseId: id })))
    expect(results.every((r) => r.status === 200)).toBe(true)
    const w = (await get(agent, '/api/workouts')).body.workout
    expect(w.exercises).toHaveLength(ids.length)
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM workouts WHERE id IN (SELECT id FROM workouts WHERE user_id = (SELECT user_id FROM workouts WHERE id = ${w.id}))`
    expect(n).toBe(1)
  })

  it('rejects bad exercise ids', async () => {
    const { agent } = await signedUpAgent()
    expect((await post(agent, '/api/workouts', { exerciseId: 999999 })).status).toBe(404)
    expect((await post(agent, '/api/workouts', { exerciseId: 'abc' })).status).toBe(400)
    expect((await post(agent, '/api/workouts', {})).status).toBe(400)
  })

  it('removes an exercise from today\'s workout', async () => {
    const { agent } = await signedUpAgent()
    const a = await exerciseByName('Dead Bug')
    const b = await exerciseByName('Jump Rope Rounds')
    await post(agent, '/api/workouts', { exerciseId: a.id })
    await post(agent, '/api/workouts', { exerciseId: b.id })
    const res = await del(agent, `/api/workouts?exerciseId=${a.id}`)
    expect(res.status).toBe(200)
    expect(res.body.workout.exercises.map((e) => e.exerciseId)).toEqual([b.id])
    expect(res.body.workout.name).toBe('Cardio Conditioning')
  })

  it('start -> tick -> untick -> finish saves duration and marks it completed', async () => {
    const { agent } = await signedUpAgent()
    const plank = await exerciseByName('Plank Hold')
    const w = (await post(agent, '/api/workouts', { exerciseId: plank.id })).body.workout

    const started = await patch(agent, '/api/workouts', { id: w.id, action: 'start' })
    expect(started.status).toBe(200)
    expect(started.body.workout.status).toBe('in_progress')
    expect(started.body.workout.startedAt).toBeTruthy()

    const [s1, s2, s3] = w.exercises[0].sets
    const tick = await patch(agent, '/api/sets', { id: s1.id, completed: true })
    expect(tick.status).toBe(200)
    expect(tick.body.set).toEqual({ id: s1.id, completed: true })
    const [saved] = await sql`SELECT completed, completed_at FROM workout_sets WHERE id = ${s1.id}`
    expect(saved.completed).toBe(true)
    expect(saved.completed_at).toBeTruthy()

    const untick = await patch(agent, '/api/sets', { id: s1.id, completed: false })
    expect(untick.body.set.completed).toBe(false)
    const [cleared] = await sql`SELECT completed, completed_at FROM workout_sets WHERE id = ${s1.id}`
    expect(cleared).toEqual({ completed: false, completed_at: null })

    for (const s of [s1, s2, s3]) await patch(agent, '/api/sets', { id: s.id, completed: true })
    const fin = await patch(agent, '/api/workouts', { id: w.id, action: 'finish' })
    expect(fin.status).toBe(200)
    expect(fin.body.workout.status).toBe('completed')
    expect(fin.body.workout.durationMinutes).toBeGreaterThanOrEqual(1)
    expect(fin.body.workout.completedAt).toBeTruthy()
    expect(fin.body.streak).toEqual({ current: 1, best: 1 })

    // A finished workout is locked.
    expect((await patch(agent, '/api/sets', { id: s1.id, completed: false })).status).toBe(404)
    expect((await patch(agent, '/api/workouts', { id: w.id, action: 'finish' })).status).toBe(409)
    expect((await patch(agent, '/api/workouts', { id: w.id, action: 'restart' })).status).toBe(409)
    expect((await get(agent, '/api/workouts')).body.workout.status).toBe('completed')
  })

  it('ticking a set on a planned workout starts it', async () => {
    const { agent } = await signedUpAgent()
    const ex = await exerciseByName('Hammer Curls')
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    await patch(agent, '/api/sets', { id: w.exercises[0].sets[0].id, completed: true })
    const now = (await get(agent, '/api/workouts')).body.workout
    expect(now.status).toBe('in_progress')
    expect(now.startedAt).toBeTruthy()
  })

  it('cannot finish before ticking at least one set', async () => {
    const { agent } = await signedUpAgent()
    const ex = await exerciseByName('Lat Pulldown')
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    const res = await patch(agent, '/api/workouts', { id: w.id, action: 'finish' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/at least one set/i)
  })

  it('restart clears all ticked sets', async () => {
    const { agent } = await signedUpAgent()
    const ex = await exerciseByName('Leg Press')
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    await patch(agent, '/api/sets', { id: w.exercises[0].sets[0].id, completed: true })
    const res = await patch(agent, '/api/workouts', { id: w.id, action: 'restart' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('in_progress')
    expect(res.body.workout.exercises[0].sets.every((s) => !s.completed)).toBe(true)
  })

  it('after finishing, adding an exercise starts a new workout for today', async () => {
    const { agent } = await signedUpAgent()
    const ex = await exerciseByName('Plank Hold')
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    await patch(agent, '/api/sets', { id: w.exercises[0].sets[0].id, completed: true })
    await patch(agent, '/api/workouts', { id: w.id, action: 'finish' })
    const next = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    expect(next.id).not.toBe(w.id)
    expect(next.status).toBe('planned')
  })

  it('validates PATCH bodies', async () => {
    const { agent } = await signedUpAgent()
    const ex = await exerciseByName('Plank Hold')
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    expect((await patch(agent, '/api/workouts', { id: w.id, action: 'explode' })).status).toBe(400)
    expect((await patch(agent, '/api/workouts', { id: 'x', action: 'start' })).status).toBe(400)
    expect((await patch(agent, '/api/sets', { id: w.exercises[0].sets[0].id, completed: 'yes' })).status).toBe(400)
    expect((await patch(agent, '/api/sets', { id: -1, completed: true })).status).toBe(400)
    expect((await patch(agent, '/api/sets', { id: 99999999, completed: true })).status).toBe(404)
  })
})
