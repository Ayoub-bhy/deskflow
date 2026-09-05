import { useCallback, useEffect, useRef, useState } from 'react'
import { MIN, inQuietHours } from '../lib/time'
import { load, save } from '../lib/storage'

/**
 * Wall-clock reminder engine (Move / Water share it).
 *
 * All state is absolute timestamps in localStorage, so sleep, tab throttling
 * and reloads can't make it drift: on every tick we simply ask
 * "is Date.now() >= nextAt?". A reminder that came due while the laptop was
 * closed shows as a catch-up ("due 12 min ago") instead of silently firing late.
 */
export function useReminder(kind, cfg, now, quietHours, onDue) {
  const key = `reminder:${kind}`
  const [state, setState] = useState(() =>
    load(key, { nextAt: Date.now() + cfg.intervalMin * MIN, lastDoneAt: null, dueAt: null, doneToday: 0, day: todayKey() }),
  )
  const alertedFor = useRef(null)
  const prevInterval = useRef(cfg.intervalMin)

  useEffect(() => save(key, state), [key, state])

  // Interval edited → re-anchor from the last completion (or now).
  useEffect(() => {
    if (prevInterval.current === cfg.intervalMin) return
    prevInterval.current = cfg.intervalMin
    setState((s) => (s.dueAt ? s : { ...s, nextAt: (s.lastDoneAt ?? Date.now()) + cfg.intervalMin * MIN }))
  }, [cfg.intervalMin])

  // Daily counter reset.
  useEffect(() => {
    const d = todayKey()
    if (state.day !== d) setState((s) => ({ ...s, day: d, doneToday: 0 }))
  }, [now, state.day])

  // The actual check.
  useEffect(() => {
    if (!cfg.enabled) return
    if (state.dueAt || now < state.nextAt) return
    if (inQuietHours(quietHours, new Date(now))) {
      // Quiet: skip silently, try again in one interval.
      setState((s) => ({ ...s, nextAt: now + cfg.intervalMin * MIN }))
      return
    }
    const dueAt = state.nextAt
    setState((s) => ({ ...s, dueAt }))
    if (alertedFor.current !== dueAt) {
      alertedFor.current = dueAt
      onDue?.(kind)
    }
  }, [now, cfg.enabled, cfg.intervalMin, state.dueAt, state.nextAt, quietHours, onDue, kind])

  const done = useCallback(() => {
    const t = Date.now()
    setState((s) => ({ ...s, dueAt: null, lastDoneAt: t, nextAt: t + cfg.intervalMin * MIN, doneToday: s.doneToday + 1 }))
  }, [cfg.intervalMin])

  const snooze = useCallback(
    (min = cfg.snoozeMin) => setState((s) => ({ ...s, dueAt: null, nextAt: Date.now() + min * MIN })),
    [cfg.snoozeMin],
  )

  const skip = useCallback(() => setState((s) => ({ ...s, dueAt: null, nextAt: Date.now() + cfg.intervalMin * MIN })), [cfg.intervalMin])

  const restart = useCallback(() => setState((s) => ({ ...s, dueAt: null, nextAt: Date.now() + cfg.intervalMin * MIN })), [cfg.intervalMin])

  return {
    ...state,
    due: Boolean(state.dueAt),
    overdueMs: state.dueAt ? now - state.dueAt : 0,
    remainingMs: Math.max(0, state.nextAt - now),
    progress: state.dueAt ? 1 : 1 - Math.max(0, state.nextAt - now) / (cfg.intervalMin * MIN),
    done,
    snooze,
    skip,
    restart,
  }
}

function todayKey() {
  return new Date().toDateString()
}
