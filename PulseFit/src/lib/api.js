// Tiny client for the /api backend. The browser never talks to the database directly.

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
  get isDbDown() {
    return this.code === 'DB_UNAVAILABLE'
  }
  get isUnauthenticated() {
    return this.status === 401
  }
}

const timeZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
})()

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Timezone': timeZone,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError("Can't reach the PulseFit server. Is it running?", 0, 'NETWORK')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON response */
  }
  if (!res.ok) {
    if (!data && (res.status >= 500 || res.status === 404)) {
      throw new ApiError("Can't reach the PulseFit server. Is it running?", res.status, 'NETWORK')
    }
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code)
  }
  return data
}
