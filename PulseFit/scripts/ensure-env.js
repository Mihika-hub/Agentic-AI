// Makes sure .env exists with the variables PulseFit needs.
// - Generates a strong JWT_SECRET if it is missing.
// - Warns loudly (but does not crash) if DATABASE_URL is missing.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')

function readValue(text, key) {
  const m = text.match(new RegExp(`^\s*${key}\s*=\s*(.*)\s*$`, 'm'))
  if (!m) return ''
  return m[1].trim().replace(/^['"]|['"]$/g, '')
}

export function ensureEnv({ quiet = false } = {}) {
  let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  let changed = false

  if (!/^\s*DATABASE_URL\s*=/m.test(text)) {
    text += `${text && !text.endsWith('\n') ? '\n' : ''}DATABASE_URL=\n`
    changed = true
  }
  if (!readValue(text, 'JWT_SECRET')) {
    const secret = randomBytes(48).toString('base64url')
    if (/^\s*JWT_SECRET\s*=/m.test(text)) text = text.replace(/^\s*JWT_SECRET\s*=.*$/m, `JWT_SECRET=${secret}`)
    else text += `${text && !text.endsWith('\n') ? '\n' : ''}JWT_SECRET=${secret}\n`
    changed = true
    if (!quiet) console.log('🔐 Generated a new JWT_SECRET and saved it to .env')
  }
  if (changed) writeFileSync(envPath, text)

  const hasDb = Boolean(readValue(text, 'DATABASE_URL'))
  if (!hasDb && !quiet) {
    console.log(
      '🗄️  DATABASE_URL is empty, so PulseFit will use the local database in .data/pulsefit\n' +
        '   (To use Neon instead: Neon dashboard → your project → Connect → copy the connection string into .env)',
    )
  }
  return { hasDb }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  ensureEnv()
}
