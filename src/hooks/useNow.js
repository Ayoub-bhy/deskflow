import { useEffect, useState } from 'react'

/**
 * Coarse wall-clock ticker. Precision is irrelevant: all timers compare
 * Date.now() against stored target timestamps, so background throttling
 * (Chrome collapses hidden-tab timers to ~1/min) only delays the *display*,
 * never the maths. We also re-tick on visibilitychange/focus so a tab that
 * wakes from sleep catches up instantly.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [intervalMs])
  return now
}
