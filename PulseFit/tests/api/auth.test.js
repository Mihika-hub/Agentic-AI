import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app, cleanupTestUsers, cookieHeader, signedUpAgent, sql, testEmail } from './helpers.js'

afterAll(cleanupTestUsers)

const validSignup = (overrides = {}) => ({
  fullName: 'Signup Tester',
  email: testEmail('signup'),
  password: 'Test1234!',
  weeklyGoalWorkouts: 4,
  weeklyGoalMinutes: 180,
  ...overrides,
})

describe('POST /api/auth/signup', () => {
  it('creates the account, sets an httpOnly session cookie and never returns the password hash', async () => {
    const body = validSignup()
    const res = await request(app).post('/api/auth/signup').send(body)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: body.email, fullName: 'Signup Tester', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i)
    const cookie = cookieHeader(res)
    expect(cookie).toMatch(/pulsefit_session=[^;]+/)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)

    const [row] = await sql`SELECT password_hash FROM users WHERE email = ${body.email}`
    expect(row.password_hash).toMatch(/^\$2[aby]\$/)
    expect(row.password_hash).not.toContain('Test1234!')
  })

  it('stores the email in lowercase and trims the name', async () => {
    const email = testEmail('case').toUpperCase().replace('@PULSEFIT.TEST', '@pulsefit.test')
    const res = await request(app).post('/api/auth/signup').send(validSignup({ email, fullName: '  Spacey Name  ' }))
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(email.toLowerCase())
    expect(res.body.user.fullName).toBe('Spacey Name')
  })

  it('blocks a duplicate email, even with different capitalisation', async () => {
    const body = validSignup()
    expect((await request(app).post('/api/auth/signup').send(body)).status).toBe(201)
    const again = await request(app).post('/api/auth/signup').send({ ...body, email: body.email.toUpperCase() })
    expect(again.status).toBe(409)
    expect(again.body.error).toMatch(/already exists/i)
  })

  it.each([
    ['empty', ''],
    ['too short', 'Ab1!'],
    ['letters only', 'abcdefghij'],
    ['numbers only', '1234567890'],
    ['only spaces', '          '],
  ])('blocks a weak password (%s)', async (_label, password) => {
    const res = await request(app).post('/api/auth/signup').send(validSignup({ password }))
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/password/i)
  })

  it('blocks a missing name, a bad email and out-of-range goals', async () => {
    expect((await request(app).post('/api/auth/signup').send(validSignup({ fullName: '   ' }))).status).toBe(400)
    expect((await request(app).post('/api/auth/signup').send(validSignup({ email: 'not-an-email' }))).status).toBe(400)
    expect((await request(app).post('/api/auth/signup').send(validSignup({ weeklyGoalWorkouts: 0 }))).status).toBe(400)
    expect((await request(app).post('/api/auth/signup').send(validSignup({ weeklyGoalMinutes: 'lots' }))).status).toBe(400)
  })

  it('rejects malformed JSON with a JSON error, not an HTML page', async () => {
    const res = await request(app).post('/api/auth/signup').set('Content-Type', 'application/json').send('{"email": ')
    expect(res.status).toBe(400)
    expect(res.headers['content-type']).toMatch(/json/)
    expect(res.body.error).toMatch(/invalid json/i)
  })

  it('only allows POST', async () => {
    expect((await request(app).get('/api/auth/signup')).status).toBe(405)
  })
})

describe('POST /api/auth/login and /api/auth/logout', () => {
  it('logs in with the right password (email is case-insensitive)', async () => {
    const { user, password } = await signedUpAgent()
    const res = await request(app).post('/api/auth/login').send({ email: user.email.toUpperCase(), password })
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
    expect(cookieHeader(res)).toMatch(/pulsefit_session=[^;]+;/)
  })

  it('fails with a wrong password or unknown email, using the same message', async () => {
    const { user } = await signedUpAgent()
    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong1234!' })
    const unknown = await request(app).post('/api/auth/login').send({ email: testEmail('nobody'), password: 'Test1234!' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.error).toBe(unknown.body.error)
    expect(cookieHeader(wrong)).not.toMatch(/pulsefit_session=[^;]+;/)
  })

  it('fails when email or password is empty', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: '', password: '' })).status).toBe(400)
  })

  it('sets a readable "logged in" hint cookie that holds no secret, and clears it on logout', async () => {
    const { user, password } = await signedUpAgent()
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password })
    const cookies = [].concat(res.headers['set-cookie'])
    const hint = cookies.find((c) => c.startsWith('pulsefit_logged_in='))
    const session = cookies.find((c) => c.startsWith('pulsefit_session='))
    expect(hint).toMatch(/^pulsefit_logged_in=1;/)
    expect(hint).not.toMatch(/HttpOnly/i)
    expect(session).toMatch(/HttpOnly/i)
    const out = [].concat((await request(app).post('/api/auth/logout')).headers['set-cookie'])
    expect(out.find((c) => c.startsWith('pulsefit_logged_in='))).toMatch(/Max-Age=0/)
  })

  it('logout clears the cookie, after which /me is 401', async () => {
    const { agent } = await signedUpAgent()
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    const out = await agent.post('/api/auth/logout')
    expect(out.status).toBe(200)
    expect(cookieHeader(out)).toMatch(/pulsefit_session=;.*Max-Age=0/i)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the logged-in user and their streak', async () => {
    const { agent, user } = await signedUpAgent({ fullName: 'Me Tester' })
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ id: user.id, fullName: 'Me Tester' })
    expect(res.body.streak).toEqual({ current: 0, best: 0 })
  })

  it('returns 401 when logged out', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 for a forged or tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'pulsefit_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.forged')
    expect(res.status).toBe(401)
  })

  it('returns 401 (and clears the cookie) if the account was deleted', async () => {
    const { agent, user } = await signedUpAgent()
    await sql`DELETE FROM users WHERE id = ${user.id}`
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(cookieHeader(res)).toMatch(/Max-Age=0/)
  })
})
