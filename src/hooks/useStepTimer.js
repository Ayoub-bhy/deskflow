import { useEffect, useRef, useState } from 'react'

/**
 * Drives a sequence of timed steps (guided routine, mind reset).
 * Wall-clock based (endsAt), ticks at `tickMs`, calls `onStep` when a step
 * auto-advances and `onFinish` after the last one. Escape closes.
 */
export function useStepTimer(steps, { onStep, onFinish, onClose, tickMs = 250 }) {
  const [i, setI] = useState(0)
  const [endsAt, setEndsAt] = useState(() => Date.now() + steps[0].seconds * 1000)
  const [now, setNow] = useState(() => Date.now())
  const cb = useRef({ onStep, onFinish, onClose })
  cb.current = { onStep, onFinish, onClose }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs)
    const onKey = (e) => e.key === 'Escape' && cb.current.onClose?.()
    window.addEventListener('keydown', onKey)
    return () => { clearInterval(id); window.removeEventListener('keydown', onKey) }
  }, [tickMs])

  const goTo = (n) => {
    if (n >= steps.length) return cb.current.onFinish?.()
    setI(n)
    setEndsAt(Date.now() + steps[n].seconds * 1000)
  }

  useEffect(() => {
    if (now >= endsAt) {
      if (i < steps.length - 1) { cb.current.onStep?.(); goTo(i + 1) } else cb.current.onFinish?.()
    }
  }, [now]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = steps[i].seconds * 1000
  const remaining = Math.max(0, endsAt - now)
  return { i, step: steps[i], remaining, elapsed: total - remaining, total, next: () => goTo(i + 1) }
}
