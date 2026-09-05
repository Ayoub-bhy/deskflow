import { describe, it, expect } from 'vitest'
import { parseCalendar, nextPrayer, inPrayerWindow, prayersOn, cacheKey, calendarUrl, freshness, activeWindow, timeOn, MIN } from './prayer'

// Two days from the real Aladhan Riyadh calendar (Sept 2026): Fri 4 and Sat 5.
const payload = {
  data: [
    { date: { gregorian: { date: '04-09-2026' }, hijri: { day: '22', month: { en: 'Rabīʿ al-awwal', ar: 'رَبيع الأوّل' }, year: '1448' } }, meta: { timezone: 'Asia/Riyadh' },
      timings: { Fajr: '04:15 (+03)', Sunrise: '05:35 (+03)', Dhuhr: '11:53 (+03)', Asr: '15:23 (+03)', Maghrib: '18:10 (+03)', Isha: '19:40 (+03)' } },
    { date: { gregorian: { date: '05-09-2026' }, hijri: { day: '23', month: { en: 'Rabīʿ al-awwal', ar: 'رَبيع الأوّل' }, year: '1448' } }, meta: { timezone: 'Asia/Riyadh' },
      timings: { Fajr: '04:16 (+03)', Sunrise: '05:36 (+03)', Dhuhr: '11:52 (+03)', Asr: '15:22 (+03)', Maghrib: '18:08 (+03)', Isha: '19:38 (+03)' } },
  ],
}
const days = parseCalendar(payload)
const at = (s) => new Date(s).getTime()

describe('prayer times', () => {
  it('parses the Aladhan calendar into a compact days map', () => {
    expect(days['2026-09-05']).toMatchObject({ Fajr: '04:16', Dhuhr: '11:52', Isha: '19:38', tz: 'Asia/Riyadh' })
    expect(days['2026-09-05'].hijri).toEqual({ day: 23, month: 'Rabīʿ al-awwal', monthAr: 'رَبيع الأوّل', year: 1448 })
  })

  it('finds next and previous prayer, rolling into the next day after Isha', () => {
    const { next, prev } = nextPrayer(days, at('2026-09-04T12:00'), {})
    expect(next.name).toBe('Asr')
    expect(prev.name).toBe('Dhuhr')
    const late = nextPrayer(days, at('2026-09-04T22:00'), {})
    expect(late.next).toMatchObject({ name: 'Fajr', at: timeOn('2026-09-05', '04:16') })
  })

  it('marks Friday Dhuhr as Jumu‘ah and gives it a longer window', () => {
    const fri = prayersOn(days, '2026-09-04', {})
    expect(fri.find((p) => p.name === 'Dhuhr').isJumuah).toBe(true)
    expect(prayersOn(days, '2026-09-05', {}).find((p) => p.name === 'Dhuhr').isJumuah).toBe(false)
    expect(inPrayerWindow(days, at('2026-09-04T12:40'), {}, 20, 60)?.name).toBe('Dhuhr') // 47 min after Jumu'ah start
    expect(inPrayerWindow(days, at('2026-09-05T12:20'), {}, 20, 60)).toBeNull() // 28 min after Saturday Dhuhr
    expect(inPrayerWindow(days, at('2026-09-05T12:05'), {}, 20, 60)?.name).toBe('Dhuhr')
  })

  it('applies per-prayer minute offsets', () => {
    const { next } = nextPrayer(days, at('2026-09-05T15:00'), { Asr: 5 })
    expect(next.at).toBe(timeOn('2026-09-05', '15:22') + 5 * MIN)
  })

  it('sunnah windows: morning adhkar, Duha, evening adhkar', () => {
    expect(activeWindow(days, at('2026-09-05T05:00'), {})).toBe('morningAdhkar')
    expect(activeWindow(days, at('2026-09-05T09:00'), {})).toBe('duha')
    expect(activeWindow(days, at('2026-09-05T16:00'), {})).toBe('eveningAdhkar')
    expect(activeWindow(days, at('2026-09-05T13:00'), {})).toBeNull()
  })

  it('cache key and URL change with location, method, school', () => {
    const base = { lat: 24.7136, lon: 46.6753, method: 4, school: 0 }
    const k1 = cacheKey(base, 2026, 9)
    expect(k1).toBe('24.714,46.675|m4|s0|l3|2026-09')
    expect(cacheKey({ ...base, school: 1 }, 2026, 9)).not.toBe(k1)
    expect(cacheKey({ ...base, method: 3 }, 2026, 9)).not.toBe(k1)
    expect(calendarUrl(base, 2026, 9)).toContain('/calendar/2026/9?latitude=24.7136&longitude=46.6753&method=4&school=0')
    expect(calendarUrl({ city: 'Riyadh', country: 'SA', method: 4, school: 0 }, 2026, 10)).toContain('/calendarByCity/2026/10?city=Riyadh&country=SA')
  })

  it('freshness flags missing days, old fetches and timezone mismatch', () => {
    const now = at('2026-09-05T10:00')
    expect(freshness(null, now, 'Asia/Riyadh').ok).toBe(false)
    expect(freshness({ days, fetchedAt: now - 1000 }, at('2026-09-07T10:00'), 'Asia/Riyadh')).toMatchObject({ ok: false, reason: 'missing' })
    expect(freshness({ days, fetchedAt: now - 50 * 24 * 60 * MIN }, now, 'Asia/Riyadh')).toMatchObject({ ok: false, reason: 'old' })
    expect(freshness({ days, fetchedAt: now }, now, 'Europe/Paris')).toMatchObject({ ok: true, reason: 'tz', tz: 'Asia/Riyadh' })
    expect(freshness({ days, fetchedAt: now }, now, 'Asia/Riyadh')).toEqual({ ok: true, reason: null })
  })
})
