import { SignJWT, jwtVerify } from 'jose'
import { HttpError } from './http.js'

export const COOKIE_NAME = 'pulsefit_session'
// Readable by the browser, holds no secret. It only tells the frontend a session may exist,
// so logged-out visitors never trigger a 401 (which browsers log as a console error).
export const HINT_COOKIE_NAME = 'pulsefit_logged_in'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET is missing or too short')
  return new TextEncoder().encode(secret)
}

function isSecure() {
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production'
}

function cookie(value, maxAge, { name = COOKIE_NAME, httpOnly = true } = {}) {
  return [
    `${name}=${value}`,
    'Path=/',
    httpOnly ? 'HttpOnly' : '',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    isSecure() ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export async function setSessionCookie(res, user) {
  const token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
  res.setHeader('Set-Cookie', [
    cookie(token, MAX_AGE_SECONDS),
    cookie('1', MAX_AGE_SECONDS, { name: HINT_COOKIE_NAME, httpOnly: false }),
  ])
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [cookie('', 0), cookie('', 0, { name: HINT_COOKIE_NAME, httpOnly: false })])
}

function readCookie(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

// Returns the logged-in user's id, or null.
export async function getUserId(req) {
  const token = readCookie(req, COOKIE_NAME)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export async function requireUserId(req) {
  const id = await getUserId(req)
  if (!id) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
  return id
}
