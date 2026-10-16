import { sql, getTimeZone } from '../_lib/db.js'
import { HttpError, route } from '../_lib/http.js'
import { clearSessionCookie, getUserId } from '../_lib/auth.js'
import { publicUser } from '../_lib/users.js'
import { getStreaks } from '../_lib/stats.js'

export default route({
  async GET(req, res) {
    const userId = await getUserId(req)
    if (!userId) throw new HttpError(401, 'Not logged in', 'UNAUTHENTICATED')

    const rows = await sql`
      SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
      FROM users WHERE id = ${userId}`
    if (!rows.length) {
      clearSessionCookie(res)
      throw new HttpError(401, 'Not logged in', 'UNAUTHENTICATED')
    }
    const streak = await getStreaks(userId, getTimeZone(req))
    return { user: publicUser(rows[0]), streak }
  },
})
