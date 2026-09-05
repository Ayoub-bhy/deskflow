import { useCallback, useEffect, useRef, useState } from 'react'
import { REMINDER_KINDS } from '../reminders/registry'
import * as engine from '../lib/reminderEngine'
import { load, save } from '../lib/storage'

const KEY = 'reminders'
const VERSION = 1

/** v0 → v1: fold the legacy per-kind keys (reminder:move, …) into one document. */
function migrate(v, data) {
  if (v === 0) {
    const out = data && typeof data === 'object' ? { ...data } : {}
    for (const k of REMINDER_KINDS) {
      const legacy = load(`reminder:${k.id}`, null)
      if (legacy && !out[k.id]) out[k.id] = legacy
    }
    return out
  }
  return data
}

/**
 * All reminder timers in one hook, driven by the registry and the pure engine.
 * Returns { [id]: { ...state, due, overdueMs, remainingMs, progress, done, snooze, skip, restart } }.
 * `onDue(id)` fires once per distinct due event; `onDone(id)` on completion.
 */
export function useReminders(settings, now, quietHours, onDue, onDone) {
  const [states, setStates] = useState(() => {
    // No document yet → run the v0 import so upgrading users keep their timers.
    const stored = load(KEY, null, { version: VERSION, migrate }) ?? migrate(0, {})
    const init = {}
    for (const k of REMINDER_KINDS) init[k.id] = stored[k.id] ?? engine.initialState(Date.now(), settings[k.id].intervalMin)
    return init
  })
  const alerted = useRef({})
  const prevInterval = useRef(Object.fromEntries(REMINDER_KINDS.map((k) => [k.id, settings[k.id].intervalMin])))

  useEffect(() => save(KEY, states, { version: VERSION }), [states])

  // Interval edited → re-anchor.
  useEffect(() => {
    for (const k of REMINDER_KINDS) {
      const cur = settings[k.id].intervalMin
      if (prevInterval.current[k.id] !== cur) {
        prevInterval.current[k.id] = cur
        setStates((s) => ({ ...s, [k.id]: engine.reanchor(s[k.id], Date.now(), cur) }))
      }
    }
  }, [settings])

  // The tick: one pure pass over every kind. Idempotent, so re-running on a
  // state change is harmless; alerts are de-duplicated per dueAt.
  useEffect(() => {
    let changed = false
    const next = { ...states }
    const fired = []
    for (const k of REMINDER_KINDS) {
      const r = engine.tick(states[k.id], settings[k.id], now, quietHours)
      if (r.state !== states[k.id]) { next[k.id] = r.state; changed = true }
      if (r.fired && alerted.current[k.id] !== r.fired) { alerted.current[k.id] = r.fired; fired.push(k.id) }
    }
    if (changed) setStates(next)
    fired.forEach((id) => onDue?.(id))
  }, [now, states, settings, quietHours, onDue])

  const act = useCallback(
    (id, fn) => setStates((s) => ({ ...s, [id]: fn(s[id], Date.now(), settings[id]) })),
    [settings],
  )

  const api = {}
  for (const k of REMINDER_KINDS) {
    const cfg = settings[k.id]
    const st = states[k.id]
    api[k.id] = {
      ...st,
      ...engine.derive(st, now, cfg.intervalMin),
      done: () => { act(k.id, (s, t, c) => engine.done(s, t, c.intervalMin)); onDone?.(k.id) },
      snooze: (min) => act(k.id, (s, t, c) => engine.snooze(s, t, min ?? c.snoozeMin)),
      skip: () => act(k.id, (s, t, c) => engine.skip(s, t, c.intervalMin)),
      restart: () => act(k.id, (s, t, c) => engine.skip(s, t, c.intervalMin)),
    }
  }
  return api
}
