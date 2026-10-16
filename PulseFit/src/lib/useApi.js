import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

// Loads GET /api{path} on mount. Returns { data, setData, error, loading, reload }.
export function useApi(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const ctrl = useRef(null)

  const reload = useCallback(async () => {
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setLoading(true)
    setError(null)
    try {
      const result = await api(path, { signal: c.signal })
      if (!c.signal.aborted) setData(result)
    } catch (err) {
      if (err.name !== 'AbortError') setError(err)
    } finally {
      if (!c.signal.aborted) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    reload()
    return () => ctrl.current?.abort()
  }, [reload])

  return { data, setData, error, loading, reload }
}
