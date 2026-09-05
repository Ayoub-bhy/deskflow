import { describe, it, expect } from 'vitest'
import { initialState, tick, done, snooze, skip, reanchor, derive } from './reminderEngine'
import { MIN } from './time'

const T0 = new Date('2026-09-07T10:00:00').getTime() // Monday 10:00
const cfg = { enabled: true, intervalMin: 60, snoozeMin: 5 }
const noQuiet = { enabled: false }
const quiet = { enabled: true, start: '18:00', end: '08:30', workDays: [1, 2, 3, 4, 5] }

describe('reminder engine', () => {
  it('starts one interval ahead and is not due', () => {
    const s = initialState(T0, 60)
    expect(s.nextAt).toBe(T0 + 60 * MIN)
    expect(tick(s, cfg, T0 + 59 * MIN, noQuiet).fired).toBeNull()
  })

  it('fires exactly once when nextAt passes, even after a long sleep', () => {
    const s0 = initialState(T0, 60)
    const late = T0 + 200 * MIN // laptop was asleep
    const r1 = tick(s0, cfg, late, noQuiet)
    expect(r1.fired).toBe(T0 + 60 * MIN)
    expect(r1.state.dueAt).toBe(T0 + 60 * MIN)
    const r2 = tick(r1.state, cfg, late + 1000, noQuiet)
    expect(r2.fired).toBeNull() // still due, but not re-fired
    expect(derive(r2.state, late + 1000, 60).overdueMs).toBe(140 * MIN + 1000)
  })

  it('is silent during quiet hours and reschedules one interval later', () => {
    const evening = new Date('2026-09-07T19:00:00').getTime()
    const s = { ...initialState(evening - 61 * MIN, 60) }
    const r = tick(s, cfg, evening, quiet)
    expect(r.fired).toBeNull()
    expect(r.state.dueAt).toBeNull()
    expect(r.state.nextAt).toBe(evening + 60 * MIN)
  })

  it('does nothing while disabled', () => {
    const s = initialState(T0, 60)
    expect(tick(s, { ...cfg, enabled: false }, T0 + 500 * MIN, noQuiet)).toEqual({ state: s, fired: null })
  })

  it('done / snooze / skip clear due and schedule correctly', () => {
    const due = tick(initialState(T0, 60), cfg, T0 + 61 * MIN, noQuiet).state
    const now = T0 + 62 * MIN
    expect(done(due, now, 60)).toMatchObject({ dueAt: null, lastDoneAt: now, nextAt: now + 60 * MIN, doneToday: 1 })
    expect(snooze(due, now, 5)).toMatchObject({ dueAt: null, nextAt: now + 5 * MIN, doneToday: 0 })
    expect(skip(due, now, 60)).toMatchObject({ dueAt: null, nextAt: now + 60 * MIN, doneToday: 0 })
  })

  it('re-anchors from the last completion when the interval is edited, but not while due', () => {
    let s = done(initialState(T0, 60), T0 + 10 * MIN, 60) // last done at 10:10
    s = reanchor(s, T0 + 20 * MIN, 30)
    expect(s.nextAt).toBe(T0 + 40 * MIN) // 10:10 + 30
    const due = tick(initialState(T0, 60), cfg, T0 + 61 * MIN, noQuiet).state
    expect(reanchor(due, T0 + 61 * MIN, 30)).toBe(due)
  })

  it('resets the daily counter when the local day changes', () => {
    const s = { ...done(initialState(T0, 60), T0 + MIN, 60), doneToday: 5 }
    const tomorrow = new Date('2026-09-08T09:00:00').getTime()
    expect(tick(s, cfg, tomorrow, noQuiet).state.doneToday).toBe(0)
  })

  it('progress runs 0 → 1 and clamps when due', () => {
    const s = initialState(T0, 60)
    expect(derive(s, T0, 60).progress).toBeCloseTo(0)
    expect(derive(s, T0 + 30 * MIN, 60).progress).toBeCloseTo(0.5)
    const due = tick(s, cfg, T0 + 61 * MIN, noQuiet).state
    expect(derive(due, T0 + 61 * MIN, 60).progress).toBe(1)
  })
})
