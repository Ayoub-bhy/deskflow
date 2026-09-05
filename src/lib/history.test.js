import { describe, it, expect } from 'vitest'
import { mergeMax, computeStreak, computeStats, increment, toCsv, lastWeek } from './history'

const D = (s) => new Date(s + 'T12:00:00')

describe('history', () => {
  it('increment creates the day with zeros for every kind', () => {
    const h = increment({}, '2026-09-07', 'move')
    expect(h['2026-09-07']).toEqual({ move: 1, water: 0, focus: 0, mind: 0 })
    expect(increment(h, '2026-09-07', 'move')['2026-09-07'].move).toBe(2)
  })

  it('mergeMax keeps the higher count per kind per day (never loses either device)', () => {
    const local = { '2026-09-07': { move: 3, water: 1, focus: 0, mind: 2 } }
    const remote = { '2026-09-07': { move: 1, water: 4, focus: 2 }, '2026-09-06': { move: 5 } }
    expect(mergeMax(local, remote)).toEqual({
      '2026-09-07': { move: 3, water: 4, focus: 2, mind: 2 },
      '2026-09-06': { move: 5, water: 0, focus: 0, mind: 0 },
    })
  })

  it('streak counts back from today, with today as a grace day', () => {
    const h = { '2026-09-04': { move: 4 }, '2026-09-05': { move: 8 }, '2026-09-06': { move: 4 } }
    expect(computeStreak(h, D('2026-09-06'))).toBe(3)
    expect(computeStreak(h, D('2026-09-07'))).toBe(3) // today empty → grace
    expect(computeStreak(h, D('2026-09-08'))).toBe(0) // yesterday empty → broken
    expect(computeStreak({ '2026-09-06': { move: 3 } }, D('2026-09-06'))).toBe(0) // below half goal
    expect(computeStreak({}, D('2026-09-06'))).toBe(0)
  })

  it('stats: totals, best day, active days, months newest first', () => {
    const h = { '2026-08-30': { move: 2 }, '2026-09-01': { move: 5, water: 3 }, '2026-09-02': { focus: 1 } }
    const s = computeStats(h)
    expect(s.startedAt).toBe('2026-08-30')
    expect(s.totals).toEqual({ move: 7, water: 3, focus: 1, mind: 0 })
    expect(s.best.move).toBe(5)
    expect(s.activeDays).toBe(3)
    expect(s.months.map((m) => m.key)).toEqual(['2026-09', '2026-08'])
    expect(s.months[0].totals.move).toBe(5)
  })

  it('lastWeek returns 7 entries ending today', () => {
    const w = lastWeek({ '2026-09-07': { move: 1 } }, D('2026-09-07'))
    expect(w).toHaveLength(7)
    expect(w[6]).toMatchObject({ key: '2026-09-07', isToday: true, move: 1 })
    expect(w[0].key).toBe('2026-09-01')
  })

  it('exports CSV with a header and sorted rows', () => {
    const csv = toCsv({ '2026-09-02': { move: 1 }, '2026-09-01': { water: 2 } })
    expect(csv.split('\n')).toEqual(['date,move,water,focus,mind', '2026-09-01,0,2,0,0', '2026-09-02,1,0,0,0'])
  })
})
