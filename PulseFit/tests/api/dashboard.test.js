import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTestUsers, get, insertCompletedWorkout, patch, post, signedUpAgent, sql, TZ } from './helpers.js'

afterAll(cleanupTestUsers)

async function todayInTz() {
  const [{ d }] = await sql`SELECT (now() AT TIME ZONE ${TZ})::date::text AS d`
  return d
}

async function dashboardFor(setup, goals = {}) {
  const { agent, user } = await signedUpAgent(goals)
  await setup(user.id)
  const res = await get(agent, '/api/dashboard')
  expect(res.status).toBe(200)
  return res.body
}

describe('/api/dashboard streak (backdated workouts)', () => {
  it('no workouts: streak 0', async () => {
    const d = await dashboardFor(async () => {})
    expect(d.streak).toEqual({ current: 0, best: 0 })
  })

  it('3 days in a row ending today: streak 3', async () => {
    const d = await dashboardFor(async (id) => {
      for (const n of [0, 1, 2]) await insertCompletedWorkout(id, n)
    })
    expect(d.streak).toEqual({ current: 3, best: 3 })
  })

  it('a missed day resets the streak but best is remembered', async () => {
    const d = await dashboardFor(async (id) => {
      for (const n of [0, 2, 3, 4]) await insertCompletedWorkout(id, n) // yesterday missed
    })
    expect(d.streak).toEqual({ current: 1, best: 3 })
  })

  it('last workout two days ago: current streak is 0', async () => {
    const d = await dashboardFor(async (id) => {
      for (const n of [2, 3]) await insertCompletedWorkout(id, n)
    })
    expect(d.streak).toEqual({ current: 0, best: 2 })
  })

  it('a workout today plus yesterday: streak 2', async () => {
    const d = await dashboardFor(async (id) => {
      await insertCompletedWorkout(id, 0)
      await insertCompletedWorkout(id, 1)
    })
    expect(d.streak.current).toBe(2)
  })

  it('yesterday only (nothing yet today): streak still counts', async () => {
    const d = await dashboardFor(async (id) => insertCompletedWorkout(id, 1))
    expect(d.streak.current).toBe(1)
  })

  it('two workouts on the same day count as one day', async () => {
    const d = await dashboardFor(async (id) => {
      await insertCompletedWorkout(id, 0)
      await insertCompletedWorkout(id, 0)
    })
    expect(d.streak.current).toBe(1)
  })

  it('unfinished workouts do not count toward the streak', async () => {
    const { agent } = await signedUpAgent()
    const [ex] = await sql`SELECT id FROM exercises LIMIT 1`
    const w = (await post(agent, '/api/workouts', { exerciseId: ex.id })).body.workout
    await patch(agent, '/api/workouts', { id: w.id, action: 'start' })
    expect((await get(agent, '/api/dashboard')).body.streak.current).toBe(0)
  })
})

describe('/api/dashboard weekly chart', () => {
  it('always has exactly 7 days, oldest first and today last', async () => {
    const d = await dashboardFor(async () => {})
    expect(d.activity).toHaveLength(7)
    expect(d.activity.at(-1).date).toBe(await todayInTz())
    const dates = d.activity.map((a) => Date.parse(a.date))
    for (let i = 1; i < 7; i++) expect(dates[i] - dates[i - 1]).toBe(86400000)
    for (const a of d.activity) {
      expect(a.day).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
      expect(Number.isInteger(a.minutes)).toBe(true)
    }
  })

  it('shows active minutes on the right days and ignores workouts older than 7 days', async () => {
    const d = await dashboardFor(async (id) => {
      await insertCompletedWorkout(id, 0, 30)
      await insertCompletedWorkout(id, 0, 15)
      await insertCompletedWorkout(id, 3, 40)
      await insertCompletedWorkout(id, 7, 99) // 8th day back: outside the chart
    })
    expect(d.activity.map((a) => a.minutes)).toEqual([0, 0, 0, 40, 0, 0, 45])
  })

  it('compares with the previous 7 days', async () => {
    const d = await dashboardFor(async (id) => {
      await insertCompletedWorkout(id, 0, 60)
      await insertCompletedWorkout(id, 8, 40)
    })
    expect(d.activityChangePct).toBe(50)
  })

  it('has no comparison (null, not NaN/Infinity) when last week was empty', async () => {
    const d = await dashboardFor(async (id) => insertCompletedWorkout(id, 0, 20))
    expect(d.activityChangePct).toBeNull()
  })
})

describe('/api/dashboard progress rings', () => {
  it('start at zero against the user\'s goals', async () => {
    const d = await dashboardFor(async () => {}, { weeklyGoalWorkouts: 5, weeklyGoalMinutes: 200 })
    expect(d.rings.map((r) => [r.key, r.value, r.goal])).toEqual([
      ['workouts', 0, 5],
      ['minutes', 0, 200],
      ['goals', 0, 2],
    ])
  })

  it('count this calendar week (Monday start) and how many goals were hit', async () => {
    const [{ dow }] = await sql`SELECT extract(isodow FROM (now() AT TIME ZONE ${TZ}))::int AS dow`
    const daysSinceMonday = dow - 1
    const d = await dashboardFor(
      async (id) => {
        await insertCompletedWorkout(id, 0, 50)
        await insertCompletedWorkout(id, daysSinceMonday, 30) // Monday of this week (or today)
        await insertCompletedWorkout(id, daysSinceMonday + 1, 500) // last week's Sunday: not counted
      },
      { weeklyGoalWorkouts: 2, weeklyGoalMinutes: 60 },
    )
    const ring = Object.fromEntries(d.rings.map((r) => [r.key, r]))
    expect(ring.workouts.value).toBe(2)
    expect(ring.minutes.value).toBe(80)
    expect(ring.goals.value).toBe(2)
    expect(d.week).toHaveLength(7)
    expect(d.week.filter((w) => w.trained).length).toBe(daysSinceMonday === 0 ? 1 : 2)
  })

  it('values over the goal are allowed in data and every number is finite', async () => {
    const d = await dashboardFor(
      async (id) => {
        for (const n of [0, 0, 0]) await insertCompletedWorkout(id, n, 100)
      },
      { weeklyGoalWorkouts: 1, weeklyGoalMinutes: 10 },
    )
    for (const r of d.rings) {
      expect(Number.isFinite(r.value)).toBe(true)
      expect(Number.isFinite(r.goal)).toBe(true)
      expect(r.goal).toBeGreaterThan(0)
    }
    expect(d.rings[0].value).toBe(3)
  })

  it('returns the next upcoming class or null', async () => {
    const d = await dashboardFor(async () => {})
    if (d.nextClass) {
      expect(new Date(d.nextClass.startTime).getTime()).toBeGreaterThan(Date.now())
      expect(d.nextClass.title).toEqual(expect.any(String))
    } else {
      expect(d.nextClass).toBeNull()
    }
  })
})
