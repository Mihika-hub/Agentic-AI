// Builds the Express app that serves the /api folder exactly like Vercel does:
// api/stats.js -> /api/stats, api/auth/login.js -> /api/auth/login.
// Files and folders starting with "_" (like api/_lib) are private helpers, never routes.
// Used by the local dev server and by the backend tests.
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(root, 'api')

function resolveRoute(urlPath) {
  const parts = urlPath.split('/').filter(Boolean)
  if (parts.some((p) => p.startsWith('_') || p.startsWith('.') || p.includes('..'))) return null
  const base = path.join(apiDir, ...parts)
  for (const candidate of [`${base}.js`, path.join(base, 'index.js')]) {
    if (candidate.startsWith(apiDir) && existsSync(candidate)) return candidate
  }
  return null
}

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  app.use('/api', async (req, res) => {
    const file = resolveRoute(req.path)
    if (!file) return res.status(404).json({ error: `No API route for ${req.originalUrl}` })
    try {
      const mod = await import(pathToFileURL(file).href)
      await mod.default(req, res)
    } catch (err) {
      console.error(`[api] ${req.method} ${req.originalUrl} crashed:`, err)
      if (!res.headersSent) res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
    }
  })

  // Malformed JSON bodies get a JSON error (like Vercel) instead of Express's HTML page.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500
    res.status(status).json({ error: status === 400 ? 'Invalid JSON body' : 'Something went wrong on our side. Please try again.' })
  })

  return app
}
