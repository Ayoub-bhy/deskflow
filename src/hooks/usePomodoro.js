import { useCallback, useEffect, useRef, useState } from 'react'
import { MIN } from '../lib/time'
import { load, save } from '../lib/storage'

const IDLE = { phase: 'idle', endsAt: null, pausedRemaining: null, round: 0, completedToday: 0, day: new Date().toDateString() }

/**
 * Editable Pomodoro. Remaining time = endsAt - now (never a decrementing
 * counter), so a throttled or sleeping tab still lands on the right second.
 */
export function usePomodoro(cfg, now, onPhaseEnd) {
  const [s, setS] = useState(() => load('pomodoro', IDLE))
  const firedFor = useRef(null)

  useEffect(() => save('pomodoro', s), [s])

  useEffect(() => {
    const d = new Date().toDateString()
    if (s.day !== d) setS((p) => ({ ...p, day: d, completedToday: 0 }))
  }, [now, s.day])

  const durationFor = useCallback(
    (phase) => (phase === 'focus' ? cfg.focusMin : phase === 'short' ? cfg.shortBreakMin : cfg.longBreakMin) * MIN,
    [cfg.focusMin, cfg.shortBreakMin, cfg.longBreakMin],
  )

  // Phase completion.
  useEffect(() => {
    if (s.phase === 'idle' || !s.endsAt || now < s.endsAt) return
    if (firedFor.current === s.endsAt) return
    firedFor.current = s.endsAt
    const finished = s.phase
    onPhaseEnd?.(finished)
    setS((p) => {
      if (finished === 'focus') {
        const round = p.round + 1
        const next = round % cfg.roundsBeforeLong === 0 ? 'long' : 'short'
        const completedToday = p.completedToday + 1
        return cfg.autoStartBreaks
          ? { ...p, phase: next, round, completedToday, endsAt: Date.now() + durationFor(next), pausedRemaining: null }
          : { ...p, phase: next, round, completedToday, endsAt: null, pausedRemaining: durationFor(next) }
      }
      // Break finished → wait for the user to start the next focus block (no surprise timers).
      return { ...p, phase: 'focus', endsAt: null, pausedRemaining: durationFor('focus') }
    })
  }, [now, s.phase, s.endsAt, cfg.roundsBeforeLong, cfg.autoStartBreaks, durationFor, onPhaseEnd])

  const start = useCallback(
    (phase = 'focus') => setS((p) => ({ ...p, phase, endsAt: Date.now() + durationFor(phase), pausedRemaining: null })),
    [durationFor],
  )
  const pause = useCallback(() => setS((p) => (p.endsAt ? { ...p, pausedRemaining: Math.max(0, p.endsAt - Date.now()), endsAt: null } : p)), [])
  const resume = useCallback(
    () => setS((p) => (p.pausedRemaining != null ? { ...p, endsAt: Date.now() + p.pausedRemaining, pausedRemaining: null } : p)),
    [],
  )
  const skipPhase = useCallback(() => setS((p) => ({ ...p, endsAt: Date.now() - 1 })), [])
  const reset = useCallback(() => setS((p) => ({ ...IDLE, completedToday: p.completedToday, day: p.day })), [])

  const running = Boolean(s.endsAt)
  const total = s.phase === 'idle' ? cfg.focusMin * MIN : durationFor(s.phase)
  const remainingMs = running ? Math.max(0, s.endsAt - now) : s.pausedRemaining ?? total

  return {
    ...s,
    running,
    paused: !running && s.pausedRemaining != null,
    remainingMs,
    progress: total ? 1 - remainingMs / total : 0,
    start,
    pause,
    resume,
    skipPhase,
    reset,
  }
}
