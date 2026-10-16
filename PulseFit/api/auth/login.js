import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { HttpError, readBody, route } from '../_lib/http.js'
import { setSessionCookie } from '../_lib/auth.js'
import { publicUser } from '../_lib/users.js'

// Used to keep response time similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('pulsefit-timing-placeholder', 10)

export default route({
  async POST(req, res) {
    const body = await readBody(req)
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || !password) throw new HttpError(400, 'Please enter your email and password.')

    const rows = await sql`
      SELECT id, email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
      FROM users WHERE email = ${email}`
    const user = rows[0]
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH)
    if (!user || !ok) throw new HttpError(401, 'Email or password is incorrect.')

    await setSessionCookie(res, user)
    return { user: publicUser(user) }
  },
})
