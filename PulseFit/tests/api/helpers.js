import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { createApp } from '../../server/app.js'
import { sql, localDbPath } from '../../api/_lib/db.js'

// Safety net: refuse to run against anything except a throwaway in-memory database.
if (process.env.DATABASE_URL || !localDbPath().startsWith('memory://')) {
  throw new Error('Backend tests must run against the in-memory test database only.')
}

export const TZ = 'Asia/Kolkata'
export const app = createApp()
export { sql }

export const testEmail = (label = 'user') => `test-${label}-${randomUUID().slice(0, 8)}@pulsefit.test`

// A logged-in supertest agent (cookies are kept between requests).
export async function signedUpAgent(overrides = {}) {
  const agent = request.agent(app)
  const body = {
    fullName: 'Test Runner',
    email: testEmail(),
    password: 'Test1234!',
    weeklyGoalWorkouts: 3,
    weeklyGoalMinutes: 60,
    ...overrides,
  }
  const res = await agent.post('/api/auth/signup').set('X-Timezone', TZ).send(body)
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, password: body.password }
}

export const get = (agent, url) => agent.get(url).set('X-Timezone', TZ)
export const post = (agent, url, body) => agent.post(url).set('X-Timezone', TZ).send(body)
export const patch = (agent, url, body) => agent.patch(url).set('X-Timezone', TZ).send(body)
export const del = (agent, url) => agent.delete(url).set('X-Timezone', TZ)

// Removes every test user (and, through ON DELETE CASCADE, their workouts and sets).
export async function cleanupTestUsers() {
  await sql`DELETE FROM users WHERE email LIKE 'test-%@pulsefit.test'`
}

// Inserts a completed workout N days before today (in TZ), for streak/chart tests.
export async function insertCompletedWorkout(userId, daysAgo, minutes = 30) {
  await sql`
    INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes, started_at, completed_at)
    VALUES (${userId}, 'Seeded workout', (now() AT TIME ZONE ${TZ})::date - ${daysAgo}::int, 'completed',
            ${minutes}, now(), now())`
}

export function cookieHeader(res) {
  return [].concat(res.headers['set-cookie'] || []).join('; ')
}
