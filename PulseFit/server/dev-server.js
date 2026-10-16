// Local stand-in for Vercel's serverless functions. Serves the same /api files Vercel will deploy.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureEnv } from '../scripts/ensure-env.js'
import { createApp } from './app.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.API_PORT) || 3001

ensureEnv()
const dotenv = await import('dotenv')
dotenv.config({ path: path.join(root, '.env') })

createApp().listen(PORT, () => {
  console.log(`⚡ PulseFit API ready on http://localhost:${PORT}/api (proxied through Vite)`)
})
