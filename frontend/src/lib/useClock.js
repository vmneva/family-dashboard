import { useEffect, useState } from 'react'

// Ticks a Date value forward every `intervalMs`, for panels that want to
// show the current time/date without polling an endpoint for it.
export function useClock(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
