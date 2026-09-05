import { KIND_IDS, GOALS } from '../reminders/registry'

/**
 * Pure helpers over the lifetime history map:
 *   { 'YYYY-MM-DD': { move, water, focus, mind } }
 * No Date.now() inside — callers pass `today` so everything is testable.
 */
export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const empty = () => Object.fromEntries(KIND_IDS.map((k) => [k, 0]))
export const norm = (d) => ({ ...empty(), ...(d || {}) })

export function increment(history, day, kind, delta = 1) {
  const cur = norm(history[day])
  return { ...history, [day]: { ...cur, [kind]: (cur[kind] || 0) + delta } }
}

/** Per-day, per-kind max — two devices can never lose each other's progress. */
export function mergeMax(a, b) {
  const out = { ...a }
  for (const k of Object.keys(b)) {
    const x = norm(a[k])
    const y = norm(b[k])
    out[k] = Object.fromEntries(KIND_IDS.map((kind) => [kind, Math.max(x[kind], y[kind])]))
  }
  return out
}

/** Last 7 days ending `today` (a Date), oldest → newest. */
export function lastWeek(history, today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const k = dayKey(d)
    return { key: k, dow: d.getDay(), isToday: i === 6, ...norm(history[k]) }
  })
}

/**
 * Consecutive days (ending today or yesterday) with ≥ half the move goal.
 * Today is a grace day: an unfinished today does not break the streak.
 * Bounded by the oldest key so it never scans years of empty days.
 */
export function computeStreak(history, today = new Date(), kind = 'move') {
  const need = Math.ceil(GOALS[kind] / 2)
  const oldest = Object.keys(history).sort()[0]
  if (!oldest) return 0
  let n = 0
  const d = new Date(today)
  for (let i = 0; ; i++) {
    const k = dayKey(d)
    if (k < oldest) break
    const ok = (history[k]?.[kind] || 0) >= need
    if (ok) n++
    else if (i > 0) break
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function computeStats(history) {
  const keys = Object.keys(history).sort()
  const totals = empty()
  const best = empty()
  let activeDays = 0
  const months = {}
  for (const k of keys) {
    const d = norm(history[k])
    let any = false
    for (const kind of KIND_IDS) {
      totals[kind] += d[kind]
      if (d[kind] > best[kind]) best[kind] = d[kind]
      if (d[kind]) any = true
    }
    if (any) activeDays++
    const m = k.slice(0, 7)
    months[m] ??= { key: m, totals: empty(), days: {} }
    months[m].days[k] = d
    for (const kind of KIND_IDS) months[m].totals[kind] += d[kind]
  }
  return { startedAt: keys[0] || null, totals, best, activeDays, months: Object.values(months).sort((a, b) => (a.key < b.key ? 1 : -1)) }
}

export function toCsv(history) {
  const rows = [['date', ...KIND_IDS].join(',')]
  for (const k of Object.keys(history).sort()) {
    const d = norm(history[k])
    rows.push([k, ...KIND_IDS.map((x) => d[x])].join(','))
  }
  return rows.join('\n')
}
