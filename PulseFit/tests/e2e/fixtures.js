import { test as base, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

// Every test automatically fails if the browser logs an error or warning,
// or if a page throws an uncaught exception.
export const test = base.extend({
  consoleProblems: [
    async ({ page }, use) => {
      const problems = []
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[${msg.type()}] ${msg.text()}`)
      })
      page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`))
      await use(problems)
      expect(problems, `Browser console problems:\n${problems.join('\n')}`).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export const newEmail = (label) => `test-e2e-${label}-${randomUUID().slice(0, 8)}@pulsefit.test`

// Signs up through the API (shares cookies with the page) for tests that just need a logged-in user.
export async function signUpViaApi(page, label = 'user') {
  const email = newEmail(label)
  const res = await page.request.post('/api/auth/signup', {
    data: { fullName: 'E2E Tester', email, password: 'Test1234!', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 },
  })
  expect(res.status()).toBe(201)
  return email
}

export async function addExerciseViaApi(page, name) {
  const list = await (await page.request.get('/api/exercises')).json()
  const ex = list.exercises.find((e) => e.name === name)
  const res = await page.request.post('/api/workouts', { data: { exerciseId: ex.id } })
  expect(res.status()).toBe(200)
}

export const isMobile = (testInfo) => testInfo.project.name.startsWith('mobile')
