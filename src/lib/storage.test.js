import { describe, it, expect, vi } from 'vitest'
import { load, save, onExternalChange, deepMerge } from './storage'

describe('storage', () => {
  it('round-trips with a version envelope', () => {
    save('k', { a: 1 }, { version: 2 })
    expect(JSON.parse(localStorage.getItem('deskflow:k'))).toEqual({ v: 2, data: { a: 1 } })
    expect(load('k', null, { version: 2 })).toEqual({ a: 1 })
  })

  it('reads legacy unversioned values as version 0 and migrates them', () => {
    localStorage.setItem('deskflow:settings', JSON.stringify({ quietHours: { weekdaysOnly: true } }))
    const migrate = (v, d) => (v === 0 ? { ...d, quietHours: { workDays: d.quietHours.weekdaysOnly ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6] } } : d)
    expect(load('settings', {}, { version: 1, migrate })).toEqual({ quietHours: { workDays: [1, 2, 3, 4, 5] } })
  })

  it('returns the fallback on corrupt JSON', () => {
    localStorage.setItem('deskflow:bad', '{nope')
    expect(load('bad', 'fb')).toBe('fb')
  })

  it('notifies on storage events from other tabs only for its key', () => {
    const cb = vi.fn()
    const off = onExternalChange('history', cb)
    save('history', { '2026-09-07': { move: 1 } })
    window.dispatchEvent(new StorageEvent('storage', { key: 'deskflow:other', newValue: '{}' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'deskflow:history', newValue: localStorage.getItem('deskflow:history') }))
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ '2026-09-07': { move: 1 } })
    off()
  })

  it('deepMerge merges objects, replaces arrays and nulls', () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, arr: [1] }, { a: { c: 3 }, arr: [2, 3] })).toEqual({ a: { b: 1, c: 3 }, arr: [2, 3] })
    expect(deepMerge({ lang: null }, { lang: 'ar' })).toEqual({ lang: 'ar' })
  })
})
