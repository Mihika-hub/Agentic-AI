// Runs Lighthouse against the production build in dist/ (run "npm run build" first).
// Starts its own API (throwaway in-memory database) and "vite preview", then audits
// the landing, login and dashboard pages on mobile and desktop settings.
// Usage: node scripts/lighthouse.js [label]   -> writes reports/lighthouse-<label>.json
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const label = process.argv[2] || 'latest'
const API_PORT = 3201
const WEB_PORT = 4273
const base = `http://localhost:${WEB_PORT}`
const env = {
  ...process.env,
  API_PORT: String(API_PORT),
  PULSEFIT_DB_PATH: 'memory://pulsefit-lighthouse',
  DATABASE_URL: '',
  JWT_SECRET: 'lighthouse-only-secret-that-is-long-enough-123456',
}

const procs = []
function start(cmd, args) {
  const p = spawn([cmd, ...args].join(' '), { cwd: root, env, shell: true, stdio: 'ignore' })
  procs.push(p)
}
async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}
function stopAll() {
  for (const p of procs) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' })
    else p.kill('SIGTERM')
  }
}

const results = {}
try {
  start('node', ['server/dev-server.js'])
  start('npx', ['vite', 'preview', '--port', String(WEB_PORT), '--strictPort'])
  await waitFor(`http://localhost:${API_PORT}/api/stats`)
  await waitFor(base)

  // A logged-in user with a workout, for auditing the dashboard.
  const signup = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Lighthouse Tester', email: 'test-lighthouse@pulsefit.test', password: 'Test1234!' }),
  })
  const cookie = (signup.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  await fetch(`${base}/api/workouts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: '{"exerciseId":1}' })

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
  try {
    const pages = [
      { name: 'landing', url: `${base}/` },
      { name: 'login', url: `${base}/login` },
      { name: 'dashboard', url: `${base}/dashboard`, cookie },
    ]
    for (const formFactor of ['mobile', 'desktop']) {
      for (const pg of pages) {
        const flags = {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        }
        const config =
          formFactor === 'desktop'
            ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
            : undefined
        // Mobile scores are noisy on a laptop, so take the median of 3 runs (Lighthouse's advice).
        const runs = []
        for (let run = 0; run < (formFactor === 'mobile' ? 3 : 1); run++) {
          // Real browser cookies (the app reads its readable hint cookie in JavaScript).
          const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` })
          const page = await browser.newPage()
          const client = await page.createCDPSession()
          await client.send('Network.clearBrowserCookies')
          if (pg.cookie) {
            for (const part of pg.cookie.split('; ')) {
              const [name, value] = part.split('=')
              await page.setCookie({ name, value, domain: 'localhost', path: '/' })
            }
          }
          runs.push((await lighthouse(pg.url, flags, config, page)).lhr)
          await page.close()
          browser.disconnect()
        }
        runs.sort((a, b) => (a.categories.performance?.score ?? 0) - (b.categories.performance?.score ?? 0))
        const lhr = runs[Math.floor(runs.length / 2)]
        const allPerf = runs.map((r) => Math.round((r.categories.performance?.score ?? 0) * 100))
        const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100)
        const failing = Object.values(lhr.audits)
          .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual')
          .map((a) => {
            const nodes = (a.details?.items || []).map((i) => i.node?.selector || i.node?.snippet).filter(Boolean).slice(0, 3)
            return `${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}${nodes.length ? ` [${nodes.join(' | ')}]` : ''}`
          })
        results[`${formFactor}/${pg.name}`] = {
          performance: score('performance'),
          accessibility: score('accessibility'),
          bestPractices: score('best-practices'),
          seo: score('seo'),
          performanceRuns: allPerf,
          failingAudits: failing,
        }
        console.log(formFactor.padEnd(8), pg.name.padEnd(10), JSON.stringify(results[`${formFactor}/${pg.name}`]))
      }
    }
  } finally {
    await chrome.kill()
  }
  mkdirSync(path.join(root, 'reports'), { recursive: true })
  writeFileSync(path.join(root, 'reports', `lighthouse-${label}.json`), JSON.stringify(results, null, 2))
} finally {
  stopAll()
}
