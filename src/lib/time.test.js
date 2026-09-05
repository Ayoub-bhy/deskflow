import { describe, it, expect } from 'vitest'
import { inQuietHours, fmtClock, fmtRelative, MIN } from './time'

// Sat 5 Sep 2026 is a Saturday; Mon 7 Sep is a Monday.
const at = (dateStr) => new Date(dateStr)
const q = (over = {}) => ({ enabled: true, start: '18:00', end: '08:30', workDays: [1, 2, 3, 4, 5], ...over })

describe('inQuietHours', () => {
  it('is false when disabled, whatever the time', () => {
    expect(inQuietHours(q({ enabled: false }), at('2026-09-05T23:00'))).toBe(false)
  })
  it('is quiet on non-working days all day', () => {
    expect(inQuietHours(q(), at('2026-09-05T12:00'))).toBe(true) // Saturday
    expect(inQuietHours(q(), at('2026-09-06T12:00'))).toBe(true) // Sunday
  })
  it('handles overnight ranges (18:00 → 08:30) on a working day', () => {
    expect(inQuietHours(q(), at('2026-09-07T12:00'))).toBe(false)
    expect(inQuietHours(q(), at('2026-09-07T17:59'))).toBe(false)
    expect(inQuietHours(q(), at('2026-09-07T18:00'))).toBe(true)
    expect(inQuietHours(q(), at('2026-09-07T23:30'))).toBe(true)
    expect(inQuietHours(q(), at('2026-09-08T08:29'))).toBe(true)
    expect(inQuietHours(q(), at('2026-09-08T08:30'))).toBe(false)
  })
  it('handles same-day ranges (12:00 → 13:00)', () => {
    const lunch = q({ start: '12:00', end: '13:00' })
    expect(inQuietHours(lunch, at('2026-09-07T11:59'))).toBe(false)
    expect(inQuietHours(lunch, at('2026-09-07T12:30'))).toBe(true)
    expect(inQuietHours(lunch, at('2026-09-07T13:00'))).toBe(false)
  })
  it('treats start === end as no time window', () => {
    expect(inQuietHours(q({ start: '09:00', end: '09:00' }), at('2026-09-07T09:00'))).toBe(false)
  })
  it('respects a custom working-days set (Sun–Thu, e.g. Saudi week)', () => {
    const gulf = q({ workDays: [0, 1, 2, 3, 4] })
    expect(inQuietHours(gulf, at('2026-09-06T12:00'))).toBe(false) // Sunday works
    expect(inQuietHours(gulf, at('2026-09-04T12:00'))).toBe(true) // Friday off
  })
  it('accepts the legacy weekdaysOnly flag', () => {
    expect(inQuietHours({ enabled: true, start: '18:00', end: '08:30', weekdaysOnly: false }, at('2026-09-05T12:00'))).toBe(false)
    expect(inQuietHours({ enabled: true, start: '18:00', end: '08:30', weekdaysOnly: true }, at('2026-09-05T12:00'))).toBe(true)
  })
})

describe('formatters', () => {
  it('fmtClock rounds up to the next whole second', () => {
    expect(fmtClock(0)).toBe('0:00')
    expect(fmtClock(1499_000)).toBe('24:59')
    expect(fmtClock(1500_000)).toBe('25:00')
    expect(fmtClock(61_500)).toBe('1:02')
  })
  it('fmtRelative uses the translator when given one', () => {
    const t = (k) => ({ 'reminder.min': 'د', 'reminder.now': 'الآن' })[k]
    expect(fmtRelative(0, t)).toBe('الآن')
    expect(fmtRelative(5 * MIN, t)).toBe('5 د')
    expect(fmtRelative(90 * MIN)).toBe('1h 30m')
    expect(fmtRelative(120 * MIN)).toBe('2h')
    expect(fmtRelative(20_000)).toBe('<1 min')
  })
})
