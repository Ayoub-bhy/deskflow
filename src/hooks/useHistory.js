import { useCallback, useMemo } from 'react'
import { useSyncedDoc } from './useSyncedDoc'
import { logEvent } from '../lib/cloud'
import { supabaseEnabled } from '../supabase'
import { dayKey, increment, mergeMax, lastWeek, computeStreak, computeStats, toCsv, norm } from '../lib/history'

export { GOALS } from '../reminders/registry'

/**
 * Lifetime daily counters, local-first and mirrored to profiles.history
 * (merged by per-day max, so two devices never lose each other's progress).
 * Each action is also appended to the `events` table for analytics.
 */
export function useHistory(user, now) {
  const { value: history, set } = useSyncedDoc('history', {}, { merge: mergeMax, debounceMs: 1500 }, user)

  const record = useCallback(
    (kind, delta = 1) => {
      const day = dayKey()
      set((h) => increment(h, day, kind, delta))
      if (supabaseEnabled && user) logEvent(user.uid, kind, { day })
    },
    [set, user],
  )

  // `now` (from useNow) rolls the derived views past midnight without a reload.
  const todayKey = dayKey(new Date(now))
  const today = norm(history[todayKey])
  const week = useMemo(() => lastWeek(history, new Date(now)), [history, todayKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const streak = useMemo(() => computeStreak(history, new Date(now)), [history, todayKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const stats = useMemo(() => computeStats(history), [history])
  const csv = useCallback(() => toCsv(history), [history])

  return { history, today, week, streak, stats, record, toCsv: csv }
}
