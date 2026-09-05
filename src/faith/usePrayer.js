import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { load, save } from '../lib/storage'
import { cacheKey, calendarUrl, parseCalendar, nextPrayer, inPrayerWindow, activeWindow, freshness, dayKey, MIN } from './prayer'

const KEY = 'prayerCalendar'

/**
 * Prayer times for the configured location/method, cached one month at a time.
 * Refetches when the cache key changes (location, method, school, month) or the
 * cache is older than 40 days. Fires `onAlert('prayerSoon'|'prayer', prayer)`
 * once per prayer per day. Never blocks anything when data is missing.
 */
export function usePrayer(cfg, enabled, now, onAlert) {
  const [cache, setCache] = useState(() => load(KEY, null))
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const fired = useRef({})

  const d = new Date(now)
  const key = cfg.location ? cacheKey({ ...cfg.location, method: cfg.method, school: cfg.school, latAdj: cfg.latAdj }, d.getFullYear(), d.getMonth() + 1) : null
  const nextKey = cfg.location ? cacheKey({ ...cfg.location, method: cfg.method, school: cfg.school, latAdj: cfg.latAdj }, d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear(), (d.getMonth() + 1) % 12 + 1) : null

  const fetchMonth = useCallback(async (k, year, month) => {
    const url = calendarUrl({ ...cfg.location, method: cfg.method, school: cfg.school, latAdj: cfg.latAdj }, year, month)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Aladhan ${res.status}`)
    const json = await res.json()
    if (json.code !== 200) throw new Error(json.status || 'Aladhan error')
    return { key: k, days: parseCalendar(json), fetchedAt: Date.now() }
  }, [cfg.location, cfg.method, cfg.school, cfg.latAdj])

  // (Re)fetch this month when needed; prefetch next month in the last 3 days.
  useEffect(() => {
    if (!enabled || !key) return
    const have = cache?.months?.[key]
    const fresh = have && Date.now() - have.fetchedAt < 40 * 24 * 60 * MIN
    const daysLeft = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate()
    const needNext = daysLeft <= 3 && !cache?.months?.[nextKey]
    if (fresh && !needNext) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const months = { ...(cache?.months || {}) }
        if (!fresh) months[key] = await fetchMonth(key, d.getFullYear(), d.getMonth() + 1)
        if (needNext) { const ny = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear(); const nm = (d.getMonth() + 1) % 12 + 1; months[nextKey] = await fetchMonth(nextKey, ny, nm) }
        // keep only this + next month
        const keep = Object.fromEntries(Object.entries(months).filter(([k]) => k === key || k === nextKey))
        if (!cancelled) { setCache({ months: keep }); save(KEY, { months: keep }); setStatus('ok') }
      } catch (e) {
        console.warn('prayer calendar fetch failed', e)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [enabled, key, nextKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge this + next month into one days map for lookups across month boundaries.
  const data = useMemo(() => {
    if (!key) return null
    const a = cache?.months?.[key]
    const b = cache?.months?.[nextKey]
    if (!a && !b) return null
    return { days: { ...(a?.days || {}), ...(b?.days || {}) }, fetchedAt: a?.fetchedAt ?? b?.fetchedAt }
  }, [cache, key, nextKey])

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const fresh = freshness(data, now, browserTz)
  const offsets = cfg.offsets || {}
  const { next, prev } = data ? nextPrayer(data.days, now, offsets) : { next: null, prev: null }
  const window = data && fresh.ok ? inPrayerWindow(data.days, now, offsets, cfg.pauseMin, 60) : null
  const sunnah = data ? activeWindow(data.days, now, offsets) : null
  const today = data?.days[dayKey(now)] || null

  // Alerts: heads-up and on-time, once per prayer per day.
  useEffect(() => {
    if (!enabled || !next || !fresh.ok) return
    const id = `${dayKey(next.at)}:${next.name}`
    const untilMs = next.at - now
    if (cfg.headsUpMin > 0 && untilMs <= cfg.headsUpMin * MIN && untilMs > 0 && fired.current[id + ':soon'] !== true) {
      fired.current[id + ':soon'] = true
      onAlert?.('prayerSoon', next)
    }
    if (prev && now - prev.at < 2 * MIN) {
      const pid = `${dayKey(prev.at)}:${prev.name}`
      if (fired.current[pid + ':now'] !== true) { fired.current[pid + ':now'] = true; onAlert?.('prayer', prev) }
    }
  }, [enabled, next, prev, now, fresh.ok, cfg.headsUpMin, onAlert])

  return { status, fresh, next, prev, window, sunnah, today, days: data?.days || null, refetch: () => setCache(null) }
}

/** Ask the browser once for coordinates; resolves null when declined. */
export function requestLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: Number(pos.coords.latitude.toFixed(4)), lon: Number(pos.coords.longitude.toFixed(4)), label: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}` }),
      () => resolve(null),
      { timeout: 10000, maximumAge: 6 * 60 * 60 * 1000 },
    )
  })
}
