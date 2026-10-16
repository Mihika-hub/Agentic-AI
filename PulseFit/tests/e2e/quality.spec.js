import AxeBuilder from '@axe-core/playwright'
import { test, expect, signUpViaApi, addExerciseViaApi } from './fixtures.js'

const PUBLIC_PAGES = ['/', '/login', '/signup']
const APP_PAGES = ['/dashboard', '/library', '/workout']

async function settle(page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[aria-label^="Loading"]')).toHaveCount(0)
  await page.waitForTimeout(2500) // let entrance animations and counters finish
}

async function axeViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('\n    ')}`)
}

test.describe('Accessibility (axe: button/link names, alt text, contrast, labels)', () => {
  for (const path of PUBLIC_PAGES) {
    test(`public page ${path}`, async ({ page }) => {
      await page.goto(path)
      await settle(page)
      const v = await axeViolations(page)
      expect(v, v.join('\n')).toEqual([])
    })
  }

  test('logged-in pages: dashboard, library, live workout (empty and filled)', async ({ page }) => {
    await signUpViaApi(page, 'a11y')
    for (const path of APP_PAGES) {
      await page.goto(path)
      await settle(page)
      const v = await axeViolations(page)
      expect(v, `${path}\n${v.join('\n')}`).toEqual([])
    }
    await addExerciseViaApi(page, 'Plank Hold')
    for (const path of ['/dashboard', '/workout']) {
      await page.goto(path)
      await settle(page)
      const v = await axeViolations(page)
      expect(v, `${path} with a workout\n${v.join('\n')}`).toEqual([])
    }
  })

  test('light theme pages also pass contrast checks', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pulsefit-theme', 'light'))
    await signUpViaApi(page, 'light')
    await addExerciseViaApi(page, 'Plank Hold')
    for (const path of ['/', ...APP_PAGES]) {
      await page.goto(path)
      await settle(page)
      const v = await axeViolations(page)
      expect(v, `${path} (light)\n${v.join('\n')}`).toEqual([])
    }
  })
})

test.describe('No horizontal scrolling at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('every page fits in 375px', async ({ page }) => {
    const check = async (path) => {
      await page.goto(path)
      await settle(page)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `${path} is ${scrollWidth}px wide at 375px`).toBeLessThanOrEqual(clientWidth)
    }
    for (const path of PUBLIC_PAGES) await check(path)
    await signUpViaApi(page, 'narrow')
    await addExerciseViaApi(page, 'Barbell Bench Press')
    await addExerciseViaApi(page, 'Bulgarian Split Squat')
    for (const path of APP_PAGES) await check(path)
  })
})

test.describe('Keyboard', () => {
  test('tab to "Start Your Workout" on the landing page and press Enter', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'Phones have no Tab key')
    await page.goto('/')
    let found = false
    for (let i = 0; i < 25 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => document.activeElement?.textContent?.includes('Start Your Workout'))
    }
    expect(found).toBe(true)
    // The focused element must have a visible focus outline.
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('log in using only the keyboard, then use the main buttons', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'Phones have no Tab key')
    const email = await signUpViaApi(page, 'keys')
    await page.request.post('/api/auth/logout')
    await page.goto('/login')
    await page.getByLabel('Email').focus()
    await page.keyboard.type(email)
    await page.keyboard.press('Tab')
    await page.keyboard.type('Test1234!')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/dashboard$/)

    // Library: reach an "Add" button with Tab and press it with Space.
    await page.goto('/library')
    await expect(page.locator('article')).toHaveCount(30)
    let onAdd = false
    for (let i = 0; i < 40 && !onAdd; i++) {
      await page.keyboard.press('Tab')
      onAdd = await page.evaluate(() => document.activeElement?.textContent?.includes("Add to today's workout"))
    }
    expect(onAdd).toBe(true)
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: "In today's workout" })).toHaveCount(1)

    // Live workout: tick a set with Enter.
    await page.goto('/workout')
    const set = page.getByRole('button', { name: 'Set 1 not completed' })
    await set.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Set 1 completed' })).toBeVisible()
  })
})

test('every page is free of console errors and warnings (checked automatically in every test)', async ({ page }) => {
  for (const path of PUBLIC_PAGES) {
    await page.goto(path)
    await settle(page)
  }
  await signUpViaApi(page, 'console')
  await addExerciseViaApi(page, 'Jump Rope Rounds')
  for (const path of [...APP_PAGES, '/progress', '/classes', '/profile', '/does-not-exist']) {
    await page.goto(path)
    await settle(page)
  }
})
