import { MIN, inQuietHours } from './time'

/**
 * Pure wall-clock reminder state machine. No React, no Date.now(): every
 * function takes `now` so it is deterministic and unit-testable.
 *
 * state = { nextAt, lastDoneAt, dueAt, doneToday, day }
 *   nextAt     absolute ms when the reminder next comes due
 *   dueAt      absolute ms it became due (null while not due)
 *   day        local day key of `doneToday`, reset when the day changes
 */
export const dayOf = (now) => new Date(now).toDateString()

export function initialState(now, intervalMin) {
  return { nextAt: now + intervalMin * MIN, lastDoneAt: null, dueAt: null, doneToday: 0, day: dayOf(now) }
}

/**
 * Advance the machine to `now`. Returns { state, fired } where `fired` is the
 * dueAt timestamp when the reminder became due in this tick (caller alerts once
 * per distinct dueAt), or null.
 */
export function tick(state, cfg, now, quietHours, paused = false) {
  let s = state
  const day = dayOf(now)
  if (s.day !== day) s = { ...s, day, doneToday: 0 }
  if (!cfg.enabled || s.dueAt || now < s.nextAt) return { state: s, fired: null }
  // Paused (e.g. prayer break): hold without rescheduling; it fires as soon as the pause lifts.
  if (paused) return { state: s, fired: null }
  if (inQuietHours(quietHours, new Date(now))) {
    // Quiet: skip silently and try again one interval later.
    return { state: { ...s, nextAt: now + cfg.intervalMin * MIN }, fired: null }
  }
  return { state: { ...s, dueAt: s.nextAt }, fired: s.nextAt }
}

export function done(state, now, intervalMin) {
  return { ...state, dueAt: null, lastDoneAt: now, nextAt: now + intervalMin * MIN, doneToday: state.doneToday + 1 }
}

export function snooze(state, now, minutes) {
  return { ...state, dueAt: null, nextAt: now + minutes * MIN }
}

export function skip(state, now, intervalMin) {
  return { ...state, dueAt: null, nextAt: now + intervalMin * MIN }
}

/** Interval edited by the user: re-anchor from the last completion (or now) unless currently due. */
export function reanchor(state, now, intervalMin) {
  if (state.dueAt) return state
  return { ...state, nextAt: (state.lastDoneAt ?? now) + intervalMin * MIN }
}

export function derive(state, now, intervalMin) {
  const remainingMs = Math.max(0, state.nextAt - now)
  return {
    due: Boolean(state.dueAt),
    overdueMs: state.dueAt ? now - state.dueAt : 0,
    remainingMs,
    progress: state.dueAt ? 1 : 1 - remainingMs / (intervalMin * MIN),
  }
}
