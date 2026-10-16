import { test, expect, newEmail } from './fixtures.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

test.describe('Landing page (logged out)', () => {
  test('loads with PulseFit in the navbar, headline and tab title, and the counters animate', async ({ page }) => {
    // Record every value the "Classes this week" counter shows while it animates.
    await page.addInitScript(() => {
      window.__counterValues = []
      const record = () => {
        const label = [...document.querySelectorAll('p')].find((p) => p.textContent === 'Classes this week')
        const value = label?.parentElement?.querySelector('.tabular-nums')?.textContent
        if (value && window.__counterValues.at(-1) !== value) window.__counterValues.push(value)
      }
      new MutationObserver(record).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await page.goto('/')
    await expect(page).toHaveTitle(/PulseFit/)
    await expect(page.locator('header').first()).toContainText('PulseFit')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PulseFit')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.')

    const stats = page.getByText('Classes this week')
    await stats.scrollIntoViewIfNeeded()
    await expect(stats.locator('..').locator('.tabular-nums')).toHaveText('10', { timeout: 8000 })
    const values = await page.evaluate(() => window.__counterValues)
    expect(values.length, `counter values seen: ${values.join(', ')}`).toBeGreaterThan(2)
    expect(values[0]).toBe('0')
    expect(values.at(-1)).toBe('10')
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Start Your Workout' }).first().click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('protected pages redirect to login when logged out', async ({ page }) => {
    for (const path of ['/dashboard', '/library', '/workout']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    }
  })
})

test('full journey: sign up, build a workout, train, finish, see the dashboard update, refresh, log out', async ({ page }) => {
  const email = newEmail('journey')

  await test.step('sign up and land on the Dashboard', async () => {
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Jamie Journey')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('Test1234!')
    await page.getByLabel('Workouts / week').fill('3')
    await page.getByLabel('Minutes / week').fill('90')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Jamie 👋')).toBeVisible()
    await expect(page.getByText('No workout yet today.')).toBeVisible()
    // Navbar shows the user's name and a logout button (sidebar on desktop, top bar on phones).
    await expect(page.getByText(/^Jamie( Journey)?$/).filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Log out/ })).toBeVisible()
  })

  await test.step('Workout Library: every muscle group filter shows only its cards', async () => {
    await page.goto('/library')
    await expect(page.locator('article')).toHaveCount(30)
    for (const group of GROUPS) {
      await page.getByRole('button', { name: group, exact: true }).click()
      // Wait for the filter animation to finish: exactly 5 cards, all of this group.
      await expect.poll(() => page.locator('article span.chip').allTextContents()).toEqual(Array(5).fill(group))
    }
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(page.locator('article')).toHaveCount(30)
  })

  await test.step('add 2 exercises to today\'s workout', async () => {
    await page.getByRole('button', { name: 'Core', exact: true }).click()
    for (const name of ['Plank Hold', 'Dead Bug']) {
      const card = page.locator('article', { has: page.getByRole('heading', { name, exact: true }) })
      await card.getByRole('button', { name: "Add to today's workout" }).click()
      await expect(card.getByRole('button', { name: "In today's workout" })).toBeVisible()
    }
    await expect(page.getByText("Added to today's workout 💪").first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Start today's workout \(2\)/ })).toBeVisible()
  })

  await test.step('Dashboard shows today\'s workout, click Start', async () => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Core Day' })).toBeVisible()
    await expect(page.getByText('Plank Hold')).toBeVisible()
    await expect(page.getByText('Dead Bug')).toBeVisible()
    await page.getByRole('link', { name: "Start today's workout" }).click()
    await expect(page).toHaveURL(/\/workout$/)
  })

  await test.step('Live Workout: rest timer counts down from the exercise\'s rest time', async () => {
    await expect(page.getByRole('heading', { name: 'Core Day' })).toBeVisible()
    await page.getByRole('button', { name: 'Set 1 not completed' }).first().click()
    const timer = page.locator('p.text-6xl')
    await expect(timer).toHaveText('0:45') // Plank Hold rest_seconds = 45
    await expect(timer).toHaveText('0:43', { timeout: 5000 })
    await expect(page.getByText('Breathe. Recover.')).toBeVisible()
  })

  await test.step('tick every set, the workout finishes and confetti appears', async () => {
    const open = page.locator('button[aria-pressed="false"]')
    while ((await open.count()) > 0) {
      await open.first().click()
    }
    await expect(page.getByRole('heading', { name: 'Workout complete!' })).toBeVisible()
    await expect(page.locator('body > canvas')).toHaveCount(1) // canvas-confetti draws on a fixed canvas
    await expect(page.getByText(/Your streak is now 1 day/)).toBeVisible()
    await expect(page.getByText('Workout saved 🏆')).toBeVisible()
  })

  const checkDashboard = async () => {
    await expect(page.getByRole('heading', { name: 'Core Day' })).toBeVisible()
    await expect(page.getByText('Completed today')).toBeVisible()
    // Streak card
    // Counters animate when scrolled into view, so scroll to each card first (needed on phones).
    const streak = page.locator('div.glass', { hasText: 'Workout streak' })
    await streak.scrollIntoViewIfNeeded()
    await expect(streak.locator('.tabular-nums').first()).toHaveText('1')
    await expect(streak).toContainText('day in a row')
    // Rings: 1 of 3 workouts, minutes logged
    const rings = page.locator('div.glass', { hasText: 'This week' })
    await rings.scrollIntoViewIfNeeded()
    await expect(rings).toContainText('Workouts')
    await expect(rings.locator('p.font-display').first()).toHaveText('1')
    await expect(rings).toContainText('/ 3')
    // Weekly chart: today's bar has height, total minutes > 0
    const chart = page.locator('div.glass', { hasText: 'Last 7 days' })
    await chart.scrollIntoViewIfNeeded()
    await expect(chart.locator('.tabular-nums').first()).not.toHaveText('0')
    await expect
      .poll(async () => {
        const boxes = await chart.locator('.recharts-bar-rectangle path').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
        return Math.max(0, ...boxes)
      })
      .toBeGreaterThan(5)
  }

  await test.step('Dashboard updates: streak, chart and rings show the new workout', async () => {
    await page.getByRole('link', { name: 'See dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await checkDashboard()
  })

  await test.step('refresh the page: data is still there', async () => {
    await page.reload()
    await checkDashboard()
    await page.goto('/workout')
    await expect(page.getByText('Completed today')).toBeVisible()
    await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(6)
  })

  await test.step('log out, then protected pages redirect to login', async () => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Log out/ }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Logged out')).toBeVisible()
    for (const path of ['/dashboard', '/library', '/workout']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    }
  })

  await test.step('log back in: everything is still saved', async () => {
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('Test1234!')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await checkDashboard()
  })
})
