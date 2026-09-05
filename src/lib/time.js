export const MIN = 60_000

export function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function fmtRelative(ms, t) {
  const unit = t ? t('reminder.min') : 'min'
  if (ms <= 0) return t ? t('reminder.now') : 'now'
  const m = Math.round(ms / MIN)
  if (m < 1) return `<1 ${unit}`
  if (m < 60) return `${m} ${unit}`
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
  const workDays = Array.isArray(q.workDays) ? q.workDays : q.weekdaysOnly === false ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]
  if (!workDays.includes(day)) return true
  const now = date.getHours() * 60 + date.getMinutes()
  const start = parseHM(q.start)
  const end = parseHM(q.end)
  if (start === end) return false
  return start < end ? now >= start && now < end : now >= start || now < end
}
