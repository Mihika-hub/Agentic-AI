// Runs db/schema.sql then db/seed.sql. Safe to re-run.
// Uses Neon when DATABASE_URL is set, otherwise the local database in .data/pulsefit.
// For the local database, stop "npm run dev" first: only one process can open it at a time.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ensureEnv } from './ensure-env.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
ensureEnv({ quiet: true })

const files = ['schema.sql', 'seed.sql'].map((f) => [f, readFileSync(path.join(root, 'db', f), 'utf8')])
const countSql = `SELECT (SELECT count(*)::int FROM exercises) AS exercises,
                         (SELECT count(*)::int FROM classes)   AS classes,
                         (SELECT count(*)::int FROM users)     AS users`

try {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('@neondatabase/serverless')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      for (const [name, text] of files) {
        await pool.query(text)
        console.log(`✅ Ran db/${name} on Neon`)
      }
      const { rows } = await pool.query(countSql)
      console.log('\nRow counts:')
      console.table(rows[0])
    } finally {
      await pool.end()
    }
  } else {
    const { openLocalDb } = await import('../api/_lib/localdb.js')
    const { db, close } = await openLocalDb(path.join(root, '.data', 'pulsefit'))
    try {
      for (const [name, text] of files) {
        await db.exec(text)
        console.log(`✅ Ran db/${name} on the local database (.data/pulsefit)`)
      }
      const { rows } = await db.query(countSql)
      console.log('\nRow counts:')
      console.table(rows[0])
    } finally {
      await close()
    }
  }
} catch (err) {
  console.error('\n❌ Database setup failed:', err.message)
  if (!process.env.DATABASE_URL) console.error('   If "npm run dev" is running, stop it first and try again.')
  process.exitCode = 1
}
