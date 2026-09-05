export const MIN = 60_000

export function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function fmtRelative(ms) {
  if (ms <= 0) return 'now'
  const m = Math.round(ms / MIN)
  if (m < 1) return '<1 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

function parseHM(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** True when `date` falls inside quiet hours (supports overnight ranges like 18:00 → 08:30). */
export function inQuietHours(q, date = new Date()) {
  if (!q?.enabled) return false
  const day = date.getDay()
  if (q.weekdaysOnly && (day === 0 || day === 6)) return true
  const now = date.getHours() * 60 + date.getMinutes()
  const start = parseHM(q.start)
  const end = parseHM(q.end)
  if (start === end) return false
  return start < end ? now >= start && now < end : now >= start || now < end
}
