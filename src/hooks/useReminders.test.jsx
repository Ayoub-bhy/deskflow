import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReminders } from './useReminders'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { MIN } from '../lib/time'
import { dayOf } from '../lib/reminderEngine'

const noQuiet = { enabled: false }

describe('useReminders (hook wiring)', () => {
  it('fires onDue exactly once per due event, persists, and re-fires only after done()', () => {
    vi.useFakeTimers()
    const T0 = new Date('2026-09-07T10:00:00').getTime()
    vi.setSystemTime(T0)
    const onDue = vi.fn()
    const onDone = vi.fn()
    let now = T0
    const { result, rerender } = renderHook(() => useReminders(DEFAULT_SETTINGS, now, noQuiet, onDue, onDone))

    expect(result.current.move.due).toBe(false)
    now = T0 + 61 * MIN; vi.setSystemTime(now); rerender()
    expect(result.current.move.due).toBe(true)
    now = T0 + 62 * MIN; vi.setSystemTime(now); rerender()
    now = T0 + 63 * MIN; vi.setSystemTime(now); rerender()
    expect(onDue.mock.calls.filter(([id]) => id === 'move')).toHaveLength(1)

    act(() => result.current.move.done())
    expect(onDone).toHaveBeenCalledWith('move')
    expect(result.current.move.due).toBe(false)
    expect(result.current.move.doneToday).toBe(1)
    expect(JSON.parse(localStorage.getItem('deskflow:reminders')).data.move.doneToday).toBe(1)

    now = T0 + 63 * MIN + 60 * MIN; vi.setSystemTime(now); rerender()
    expect(onDue.mock.calls.filter(([id]) => id === 'move')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('migrates legacy per-kind keys into the single document', () => {
    localStorage.setItem('deskflow:reminder:water', JSON.stringify({ nextAt: 123, lastDoneAt: null, dueAt: null, doneToday: 4, day: dayOf(Date.now()) }))
    const { result } = renderHook(() => useReminders(DEFAULT_SETTINGS, Date.now(), noQuiet))
    expect(result.current.water.doneToday).toBe(4)
  })
})
