// Small helpers shared by every /api route so they behave the same locally and on Vercel.

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}') } catch { throw new HttpError(400, 'Invalid JSON body') }
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { throw new HttpError(400, 'Invalid JSON body') }
}

function isDbConnectionError(err) {
  if (!err) return false
  if (err.code === 'DB_NOT_CONFIGURED') return true
  const text = `${err.name || ''} ${err.message || ''} ${err.cause?.code || ''} ${err.cause?.message || ''}`
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|password authentication failed|NeonDbError: .*connect|Error connecting to database|Couldn't connect|endpoint .* (could not|does not)/i.test(
    text,
  )
}

// Wraps a route: enforces allowed methods and turns thrown errors into JSON responses.
export function route(handlers) {
  return async function handler(req, res) {
    const fn = handlers[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '))
      return send(res, 405, { error: 'Method not allowed' })
    }
    try {
      const result = await fn(req, res)
      if (!res.writableEnded && result !== undefined) send(res, 200, result)
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, code: err.code })
      if (isDbConnectionError(err)) {
        console.error('[api] database unreachable:', err.message)
        return send(res, 503, {
          error: "We can't reach the database right now. Check your connection and try again.",
          code: 'DB_UNAVAILABLE',
        })
      }
      console.error('[api] unexpected error:', err)
      return send(res, 500, { error: 'Something went wrong on our side. Please try again.' })
    }
  }
}
