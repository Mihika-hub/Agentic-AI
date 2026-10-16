import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app, cleanupTestUsers, get, signedUpAgent, insertCompletedWorkout } from './helpers.js'

afterAll(cleanupTestUsers)

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

describe('GET /api/stats (public)', () => {
  it('returns members, workouts completed and classes this week as whole numbers', async () => {
    const res = await request(app).get('/api/stats')
    expect(res.status).toBe(200)
    for (const key of ['members', 'workoutsCompleted', 'classesThisWeek']) {
      expect(typeof res.body[key]).toBe('number')
      expect(Number.isInteger(res.body[key])).toBe(true)
      expect(res.body[key]).toBeGreaterThanOrEqual(0)
    }
    expect(res.body.classesThisWeek).toBe(10)
  })

  it('counts new members and completed workouts', async () => {
    const before = (await request(app).get('/api/stats')).body
    const { user } = await signedUpAgent()
    await insertCompletedWorkout(user.id, 0)
    const after = (await request(app).get('/api/stats')).body
    expect(after.members).toBe(before.members + 1)
    expect(after.workoutsCompleted).toBe(before.workoutsCompleted + 1)
  })

  it('does not leak any user details', async () => {
    const res = await request(app).get('/api/stats')
    expect(Object.keys(res.body).sort()).toEqual(['classesThisWeek', 'members', 'workoutsCompleted'])
  })
})

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with the expected fields', async () => {
    const { agent } = await signedUpAgent()
    const res = await get(agent, '/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    expect(res.body.muscleGroups).toEqual(GROUPS)
    for (const e of res.body.exercises) {
      expect(e).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          muscleGroup: expect.any(String),
          sets: expect.any(Number),
          reps: expect.any(String),
          difficulty: expect.stringMatching(/^(Beginner|Intermediate|Advanced)$/),
          restSeconds: expect.any(Number),
          description: expect.any(String),
        }),
      )
      expect(e.sets).toBeGreaterThan(0)
      expect(e.restSeconds).toBeGreaterThan(0)
    }
    expect(new Set(res.body.exercises.map((e) => e.name)).size).toBe(30)
  })

  it.each(GROUPS)('filters by muscle group: %s (5 exercises)', async (group) => {
    const { agent } = await signedUpAgent()
    const res = await get(agent, `/api/exercises?muscleGroup=${group}`)
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.muscleGroup === group)).toBe(true)
  })

  it('"All" returns everything and an unknown group is rejected', async () => {
    const { agent } = await signedUpAgent()
    expect((await get(agent, '/api/exercises?muscleGroup=All')).body.exercises).toHaveLength(30)
    expect((await get(agent, '/api/exercises?muscleGroup=Toes')).status).toBe(400)
  })
})

describe('protected routes need a login', () => {
  it.each([
    ['get', '/api/dashboard'],
    ['get', '/api/exercises'],
    ['get', '/api/workouts'],
    ['post', '/api/workouts'],
    ['patch', '/api/workouts'],
    ['delete', '/api/workouts?exerciseId=1'],
    ['patch', '/api/sets'],
  ])('%s %s returns 401 without login', async (method, url) => {
    const res = await request(app)[method](url).send({})
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHENTICATED')
  })

  it('private helper files are not reachable as routes', async () => {
    expect((await request(app).get('/api/_lib/db')).status).toBe(404)
    expect((await request(app).get('/api/../package.json')).status).toBe(404)
    expect((await request(app).get('/api/does-not-exist')).status).toBe(404)
  })

  it('wrong HTTP methods return 405', async () => {
    expect((await request(app).post('/api/stats')).status).toBe(405)
    expect((await request(app).delete('/api/dashboard')).status).toBe(405)
  })
})
