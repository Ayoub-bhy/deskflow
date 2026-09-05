import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseEnabled } from '../supabase'
import { fetchProfile, upsertProfile, logEvent } from '../lib/cloud'
import { load, save } from '../lib/storage'

export const GOALS = { move: 8, water: 8, focus: 6 } // per working day
const KEEP_DAYS = 30

export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const empty = () => ({ move: 0, water: 0, focus: 0 })

/**
 * Daily activity counters: { 'YYYY-MM-DD': { move, water, focus } }.
 * Local-first; when signed in, merged with and mirrored to profiles.history
 * (max of local/remote per day so two devices never lose progress), and each
 * action is also appended to the `events` table for analytics.
 */
export function useHistory(user) {
  const [history, setHistory] = useState(() => prune(load('history', {})))
  const writeTimer = useRef(null)
  const remoteReady = useRef(false)

  useEffect(() => save('history', history), [history])

  // Merge with the cloud copy on sign-in.
  useEffect(() => {
    remoteReady.current = false
    if (!supabaseEnabled || !user) return
    fetchProfile(user.uid)
      .then((row) => {
        const remote = row?.history || {}
        setHistory((local) => {
          const merged = mergeMax(local, remote)
          upsertProfile(user.uid, { history: merged }).catch(() => {})
          return merged
        })
        remoteReady.current = true
      })
      .catch(() => {})
  }, [user?.uid])

  const record = useCallback(
    (kind, delta = 1) => {
      setHistory((h) => {
        const k = dayKey()
        const next = prune({ ...h, [k]: { ...empty(), ...(h[k] || {}), [kind]: ((h[k] || {})[kind] || 0) + delta } })
        if (supabaseEnabled && user && remoteReady.current) {
          logEvent(user.uid, kind, { day: k })
          clearTimeout(writeTimer.current)
          writeTimer.current = setTimeout(() => upsertProfile(user.uid, { history: next }).catch(() => {}), 1500)
        }
        return next
      })
    },
    [user],
  )

  const today = history[dayKey()] || empty()

  // Last 7 days, oldest → newest.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const k = dayKey(d)
    return { key: k, label: d.toLocaleDateString(undefined, { weekday: 'short' }), isToday: i === 6, ...(history[k] || empty()) }
  })

  // Streak: consecutive days (ending today or yesterday) with at least half the move goal.
  let streak = 0
  for (let i = 0; i < KEEP_DAYS; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const day = history[dayKey(d)]
    const ok = day && day.move >= Math.ceil(GOALS.move / 2)
    if (ok) streak++
    else if (i === 0) continue // today may still be in progress
    else break
  }

  return { history, today, week, streak, record }
}

function prune(h) {
  const keys = Object.keys(h).sort()
  const cut = keys.slice(Math.max(0, keys.length - KEEP_DAYS))
  return Object.fromEntries(cut.map((k) => [k, h[k]]))
}

function mergeMax(a, b) {
  const out = { ...a }
  for (const k of Object.keys(b)) {
    out[k] = { move: Math.max(a[k]?.move || 0, b[k]?.move || 0), water: Math.max(a[k]?.water || 0, b[k]?.water || 0), focus: Math.max(a[k]?.focus || 0, b[k]?.focus || 0) }
  }
  return prune(out)
}
