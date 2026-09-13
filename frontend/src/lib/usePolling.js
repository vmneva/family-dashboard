import { useEffect, useState } from 'react'

// Fetches `path` on mount and every `intervalMs`, exposing the latest
// result/error. Used by every dashboard panel so each one only owns its
// endpoint + interval, not the fetch/poll/cleanup mechanics.
export function usePolling(path, intervalMs) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(path)
        if (!response.ok) {
          throw new Error(`${path} responded with ${response.status}`)
        }
        const data = await response.json()
        if (cancelled) return
        setState({ data, error: null, loading: false })
      } catch (error) {
        if (cancelled) return
        setState((prev) => ({ ...prev, error, loading: false }))
      }
    }

    load()
    const id = setInterval(load, intervalMs)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [path, intervalMs])

  return state
}
