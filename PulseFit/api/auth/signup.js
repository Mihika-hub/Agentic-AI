import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { HttpError, readBody, route, send } from '../_lib/http.js'
import { setSessionCookie } from '../_lib/auth.js'
import { publicUser } from '../_lib/users.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Returns a friendly problem description, or null when the password is strong enough.
export function checkPassword(password) {
  if (!password || !password.trim()) return 'Please choose a password.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 72) return 'Password must be 72 characters or fewer.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must include at least one letter and one number.'
  return null
}

function toInt(value, min, max, label) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label} must be a whole number between ${min} and ${max}.`)
  return n
}

export default route({
  async POST(req, res) {
    const body = await readBody(req)
    const fullName = String(body.fullName || '').trim().slice(0, 80)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 254)
    const password = String(body.password || '')

    if (!fullName) throw new HttpError(400, 'Please tell us your name.')
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.')
    const passwordProblem = checkPassword(password)
    if (passwordProblem) throw new HttpError(400, passwordProblem)
    const goalWorkouts = toInt(body.weeklyGoalWorkouts ?? 4, 1, 14, 'Weekly workout goal')
    const goalMinutes = toInt(body.weeklyGoalMinutes ?? 180, 10, 2000, 'Weekly minutes goal')

    const passwordHash = await bcrypt.hash(password, 10)
    const rows = await sql`
      INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at`
    if (!rows.length) throw new HttpError(409, 'An account with this email already exists. Try logging in.')

    await setSessionCookie(res, rows[0])
    send(res, 201, { user: publicUser(rows[0]) })
  },
})
