import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app, cleanupTestUsers, del, get, insertCompletedWorkout, patch, post, signedUpAgent, sql } from './helpers.js'

afterAll(cleanupTestUsers)

describe('SECURITY: users can only see and change their own data', () => {
  let A
  let B
  let workoutA
  let setA

  beforeAll(async () => {
    A = await signedUpAgent({ fullName: 'Alice A' })
    B = await signedUpAgent({ fullName: 'Bob B' })
    const [ex] = await sql`SELECT id FROM exercises WHERE name = 'Plank Hold'`
    workoutA = (await post(A.agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    setA = workoutA.exercises[0].sets[0]
    await insertCompletedWorkout(A.user.id, 1, 45)
  })

  it('B does not see A\'s workout', async () => {
    expect((await get(B.agent, '/api/workouts')).body.workout).toBeNull()
  })

  it('B\'s dashboard contains none of A\'s data', async () => {
    const res = await get(B.agent, '/api/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.user.fullName).toBe('Bob B')
    expect(res.body.todayWorkout).toBeNull()
    expect(res.body.streak).toEqual({ current: 0, best: 0 })
    expect(res.body.activity.every((d) => d.minutes === 0)).toBe(true)
  })

  it('B cannot tick or untick A\'s sets', async () => {
    const res = await patch(B.agent, '/api/sets', { id: setA.id, completed: true })
    expect(res.status).toBe(404)
    const [row] = await sql`SELECT completed FROM workout_sets WHERE id = ${setA.id}`
    expect(row.completed).toBe(false)
  })

  it('B cannot start, finish or restart A\'s workout', async () => {
    for (const action of ['start', 'finish', 'restart']) {
      const res = await patch(B.agent, '/api/workouts', { id: workoutA.id, action })
      expect(res.status).toBe(404)
    }
    const [row] = await sql`SELECT status FROM workouts WHERE id = ${workoutA.id}`
    expect(row.status).toBe('planned')
  })

  it('B adding or removing exercises never touches A\'s workout', async () => {
    const [ex] = await sql`SELECT id FROM exercises WHERE name = 'Plank Hold'`
    await del(B.agent, `/api/workouts?exerciseId=${ex.id}`)
    const bWorkout = (await post(B.agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    expect(bWorkout.id).not.toBe(workoutA.id)
    const aNow = (await get(A.agent, '/api/workouts')).body.workout
    expect(aNow.id).toBe(workoutA.id)
    expect(aNow.exercises).toHaveLength(1)
  })

  it('A still sees exactly their own data', async () => {
    const res = await get(A.agent, '/api/dashboard')
    expect(res.body.user.fullName).toBe('Alice A')
    expect(res.body.todayWorkout.id).toBe(workoutA.id)
    expect(res.body.streak.current).toBe(1)
  })

  it('the session cookie cannot be changed to impersonate someone else', async () => {
    const forged = await request(app).get('/api/auth/me').set('Cookie', `pulsefit_session=${'x'.repeat(40)}`)
    expect(forged.status).toBe(401)
    // A real token signed with a different secret is rejected too.
    const { SignJWT } = await import('jose')
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(String(A.user.id))
      .setExpirationTime('1h').sign(new TextEncoder().encode('some-other-secret-that-is-long-enough-1234'))
    const wrongKey = await request(app).get('/api/auth/me').set('Cookie', `pulsefit_session=${token}`)
    expect(wrongKey.status).toBe(401)
    // An unsigned ("alg: none") token is rejected.
    const none = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(`{"sub":"${A.user.id}"}`).toString('base64url')}.`
    expect((await request(app).get('/api/auth/me').set('Cookie', `pulsefit_session=${none}`)).status).toBe(401)
  })
})
