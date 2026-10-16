// Server-only database access. Files under api/_lib are never exposed as routes
// (Vercel skips paths starting with "_" and the local dev server does too).
//
// Two modes, chosen automatically:
//  - DATABASE_URL is set (Vercel / Neon): uses the Neon serverless driver.
//  - DATABASE_URL is empty and we are NOT on Vercel: uses a local embedded
//    Postgres (PGlite) stored in the .data/pulsefit folder. No install needed.
import { neon } from '@neondatabase/serverless'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

let neonClient
let localDbPromise

export function isLocalDb() {
  return !process.env.DATABASE_URL && !process.env.VERCEL
}

// PULSEFIT_DB_PATH lets tests use a throwaway database ("memory://") so real data is never touched.
export function localDbPath() {
  const custom = process.env.PULSEFIT_DB_PATH
  if (custom) return custom.startsWith('memory://') ? custom : path.resolve(projectRoot, custom)
  return path.resolve(projectRoot, '.data', 'pulsefit')
}

// Opens the local database once per process. Creates tables and sample data
// the first time, so "npm run dev" works even before "npm run db:setup".
export function getLocalDb() {
  if (!localDbPromise) {
    localDbPromise = (async () => {
      const { openLocalDb } = await import('./localdb.js')
      const { db } = await openLocalDb(localDbPath())
      const { rows } = await db.query(`SELECT to_regclass('public.exercises') IS NOT NULL AS ready`)
      if (!rows[0].ready) {
        for (const file of ['schema.sql', 'seed.sql']) {
          await db.exec(readFileSync(path.resolve(projectRoot, 'db', file), 'utf8'))
        }
        if (!localDbPath().startsWith('memory://')) console.log('🗄️  Local database created with sample data in .data/pulsefit')
      }
      return db
    })().catch((err) => {
      localDbPromise = null
      const e = new Error(`Local database could not be opened: ${err.message}`)
      e.code = 'DB_NOT_CONFIGURED'
      throw e
    })
  }
  return localDbPromise
}

function getNeon() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL is not set')
    err.code = 'DB_NOT_CONFIGURED'
    throw err
  }
  if (!neonClient) neonClient = neon(process.env.DATABASE_URL)
  return neonClient
}

// Tagged-template helper: await sql`SELECT ... ${value}` (values are always parameterised).
// Returns an array of row objects in both modes.
export async function sql(strings, ...values) {
  if (!isLocalDb()) return getNeon()(strings, ...values)
  const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ''), '')
  const db = await getLocalDb()
  const { rows } = await db.query(text, values)
  return rows
}

// Returns a valid IANA time zone from the X-Timezone header, falling back to UTC.
export function getTimeZone(req) {
  const tz = String(req.headers['x-timezone'] || '').slice(0, 64)
  if (!tz) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}
