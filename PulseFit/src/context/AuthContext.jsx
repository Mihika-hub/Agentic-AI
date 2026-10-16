import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function hasSessionHint() {
  try {
    return document.cookie.split(';').some((c) => c.trim() === 'pulsefit_logged_in=1')
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    // No hint cookie means no session: skip the request so logged-out visitors never hit a 401.
    if (!hasSessionHint()) {
      setUser(null)
      setStreak({ current: 0, best: 0 })
      setError(null)
      setStatus('ready')
      return
    }
    try {
      const data = await api('/auth/me')
      setUser(data.user)
      setStreak(data.streak)
      setError(null)
      setStatus('ready')
    } catch (err) {
      if (err.isUnauthenticated) {
        setUser(null)
        setError(null)
        setStatus('ready')
      } else {
        setError(err)
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    await refresh()
    return data.user
  }, [refresh])

  const signup = useCallback(async (fields) => {
    const data = await api('/auth/signup', { method: 'POST', body: fields })
    await refresh()
    return data.user
  }, [refresh])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
    setStreak({ current: 0, best: 0 })
  }, [])

  const value = useMemo(
    () => ({ user, streak, status, error, refresh, login, signup, logout }),
    [user, streak, status, error, refresh, login, signup, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
