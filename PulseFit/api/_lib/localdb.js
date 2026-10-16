// Opens the local embedded Postgres (PGlite) safely. Only used on your computer, never on Vercel.
//
// PGlite can only be used by one process at a time. If a previous server was killed
// without closing it, Postgres leaves a stale "postmaster.pid" behind and refuses to
// start. We keep our own lock file with the owning process id: if that process is
// gone, the stale Postgres lock is removed; if it is still alive, we refuse to open.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

function isAlive(pid) {
  if (!pid || pid === process.pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

export async function openLocalDb(dataDir) {
  if (dataDir.startsWith('memory://')) {
    const { PGlite } = await import('@electric-sql/pglite')
    const db = new PGlite(dataDir)
    await db.waitReady
    return { db, close: () => db.close() }
  }
  mkdirSync(path.dirname(dataDir), { recursive: true })
  const lockFile = `${dataDir}.lock`

  if (existsSync(lockFile)) {
    const owner = Number(readFileSync(lockFile, 'utf8').trim())
    if (isAlive(owner)) {
      throw new Error(
        `The local database is already open in another PulseFit process (pid ${owner}). Stop the other "npm run dev" or "npm run db:setup" first.`,
      )
    }
  }
  // No live owner, so any Postgres lock left in the folder is stale.
  rmSync(path.join(dataDir, 'postmaster.pid'), { force: true })
  writeFileSync(lockFile, String(process.pid))

  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(dataDir)
  try {
    await db.waitReady
  } catch (err) {
    rmSync(lockFile, { force: true })
    throw err
  }

  let closed = false
  const close = async () => {
    if (closed) return
    closed = true
    try {
      await db.close()
    } catch {
      /* already closed */
    }
    rmSync(lockFile, { force: true })
  }
  const onSignal = async () => {
    await close()
    process.exit(0)
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  process.once('SIGHUP', onSignal)
  process.once('beforeExit', close)

  return { db, close }
}
