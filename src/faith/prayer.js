/**
 * Pure prayer-time logic. Data comes from the Aladhan monthly calendar
 * (https://aladhan.com/prayer-times-api), fetched once per month per
 * (location, method, school) and cached; everything here is offline maths.
 *
 * All functions take `now` (ms) — no Date.now() — so they are testable.
 * Times are interpreted in the browser's local timezone, which is assumed to be
 * the location's timezone (we warn in the UI when they differ).
 */
export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
export const MIN = 60_000

export const METHODS = [
  { id: 4, name: 'Umm Al-Qura, Makkah' },
  { id: 3, name: 'Muslim World League' },
  { id: 2, name: 'ISNA (North America)' },
  { id: 5, name: 'Egyptian General Authority' },
  { id: 1, name: 'University of Karachi' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 16, name: 'Dubai' },
  { id: 12, name: 'UOIF (France)' },
  { id: 13, name: 'Diyanet (Turkey)' },
  { id: 11, name: 'MUIS (Singapore)' },
  { id: 17, name: 'JAKIM (Malaysia)' },
  { id: 20, name: 'Kemenag (Indonesia)' },
  { id: 18, name: 'Tunisia' },
  { id: 19, name: 'Algeria' },
  { id: 21, name: 'Morocco' },
  { id: 23, name: 'Jordan (Awqaf)' },
  { id: 15, name: 'Moonsighting Committee' },
]

/** Stable cache key: any change to these invalidates the cached month. */
export function cacheKey({ lat, lon, city, country, method, school, latAdj }, year, month) {
  const loc = lat != null && lon != null ? `${lat.toFixed(3)},${lon.toFixed(3)}` : `${city}|${country}`
  return `${loc}|m${method}|s${school}|l${latAdj ?? 3}|${year}-${String(month).padStart(2, '0')}`
}

/** Aladhan URL for one month. Uses coordinates when known, else city/country. */
export function calendarUrl({ lat, lon, city, country, method, school, latAdj }, year, month) {
  const base = 'https://api.aladhan.com/v1'
  const q = `method=${method}&school=${school}&latitudeAdjustmentMethod=${latAdj ?? 3}`
  if (lat != null && lon != null) return `${base}/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&${q}`
  return `${base}/calendarByCity/${year}/${month}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&${q}`
}

/**
 * Aladhan payload → compact days map:
 *   { 'YYYY-MM-DD': { Fajr:'04:16', Sunrise:'05:36', Dhuhr, Asr, Maghrib, Isha, hijri:{day,month,monthAr,year}, tz:'Asia/Riyadh' } }
 */
export function parseCalendar(payload) {
  const days = {}
  for (const d of payload?.data ?? []) {
    const [dd, mm, yyyy] = d.date.gregorian.date.split('-')
    const key = `${yyyy}-${mm}-${dd}`
    const t = {}
    for (const p of [...PRAYERS, 'Sunrise']) t[p] = (d.timings[p] || '').slice(0, 5)
    const h = d.date.hijri
    days[key] = { ...t, hijri: { day: Number(h.day), month: h.month.en, monthAr: h.month.ar, year: Number(h.year) }, tz: d.meta?.timezone }
  }
  return days
}

export function dayKey(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local-time ms for 'HH:MM' on the given day key, plus a per-prayer offset in minutes. */
export function timeOn(key, hhmm, offsetMin = 0) {
  const [y, m, d] = key.split('-').map(Number)
  const [hh, mi] = hhmm.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mi).getTime() + offsetMin * MIN
}

/** Today's (or any day's) five prayers as [{ name, at, isJumuah }], applying offsets. Friday Dhuhr is Jumu'ah. */
export function prayersOn(days, key, offsets = {}) {
  const d = days[key]
  if (!d) return []
  const isFriday = new Date(timeOn(key, '12:00')).getDay() === 5
  return PRAYERS.map((name) => ({ name, at: timeOn(key, d[name], offsets[name] || 0), isJumuah: isFriday && name === 'Dhuhr' }))
}

/** Next upcoming prayer from `now` (looks at today then tomorrow), and the most recent one. */
export function nextPrayer(days, now, offsets) {
  const today = dayKey(now)
  const tomorrow = dayKey(now + 24 * 60 * MIN)
  const list = [...prayersOn(days, today, offsets), ...prayersOn(days, tomorrow, offsets)]
  const upcoming = list.find((p) => p.at > now) || null
  const previous = [...list].reverse().find((p) => p.at <= now) || null
  return { next: upcoming, prev: previous }
}

/**
 * True while inside a prayer window: from prayer time to +pauseMin.
 * Jumu'ah gets a longer default window (khutbah + prayer).
 */
export function inPrayerWindow(days, now, offsets, pauseMin = 20, jumuahMin = 60) {
  const { prev } = nextPrayer(days, now, offsets)
  if (!prev) return null
  const len = (prev.isJumuah ? jumuahMin : pauseMin) * MIN
  return now - prev.at < len ? prev : null
}

/** Sunnah windows shown as hints: morning adhkar (Fajr→sunrise), Duha (sunrise+20m → Dhuhr−20m), evening adhkar (Asr→Maghrib). */
export function windowsOn(days, key, offsets = {}) {
  const d = days[key]
  if (!d) return null
  return {
    morningAdhkar: [timeOn(key, d.Fajr, offsets.Fajr), timeOn(key, d.Sunrise)],
    duha: [timeOn(key, d.Sunrise) + 20 * MIN, timeOn(key, d.Dhuhr, offsets.Dhuhr) - 20 * MIN],
    eveningAdhkar: [timeOn(key, d.Asr, offsets.Asr), timeOn(key, d.Maghrib, offsets.Maghrib)],
  }
}

export function activeWindow(days, now, offsets) {
  const w = windowsOn(days, dayKey(now), offsets)
  if (!w) return null
  for (const [name, [a, b]] of Object.entries(w)) if (now >= a && now < b) return name
  return null
}

/** Staleness: data for today missing, or fetched > 40 days ago, or the browser tz differs from the data tz. */
export function freshness(cache, now, browserTz) {
  if (!cache?.days || !cache.days[dayKey(now)]) return { ok: false, reason: 'missing' }
  if (now - cache.fetchedAt > 40 * 24 * 60 * MIN) return { ok: false, reason: 'old' }
  const tz = Object.values(cache.days)[0]?.tz
  if (tz && browserTz && tz !== browserTz) return { ok: true, reason: 'tz', tz }
  return { ok: true, reason: null }
}

export const fmtHM = (ms, locale) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
