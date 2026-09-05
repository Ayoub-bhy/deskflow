import { useCallback, useEffect, useRef, useState } from 'react'
import { load, save, onExternalChange } from '../lib/storage'
import { supabaseEnabled } from '../supabase'
import { fetchProfile, upsertProfile } from '../lib/cloud'

/**
 * One local-first, cloud-mirrored document. Used for `settings` and `history`.
 *
 *   key        localStorage key and profiles.<column>
 *   fallback   initial value
 *   merge      (local, remote) → merged, applied on sign-in and cross-tab change
 *   version/migrate  see lib/storage.js
 *   debounceMs remote write debounce
 *
 * Guarantees: local write is synchronous; remote write is debounced, retried
 * with backoff (3×), and never blocks the UI; another tab's write is picked
 * up through the `storage` event and merged; on sign-in remote and local are
 * merged and pushed back so no device loses data.
 *
 * Returns { value, set(nextOrFn), status } where status ∈ local|syncing|synced|error.
 */
export function useSyncedDoc(key, fallback, { merge, version = 1, migrate, debounceMs = 1000 }, user) {
  const opts = { version, migrate }
  const [value, setValue] = useState(() => load(key, fallback, opts))
  const [status, setStatus] = useState('local')
  const timer = useRef(null)
  const remoteReady = useRef(false)
  const latest = useRef(value)
  latest.current = value

  // Persist locally on every change.
  useEffect(() => save(key, value, opts), [key, value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-tab: merge what another tab wrote.
  useEffect(
    () =>
      onExternalChange(key, (ext) => { if (ext !== undefined) setValue((cur) => merge(cur, ext)) }, opts),
    [key], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Sign-in: merge remote, push merged back.
  useEffect(() => {
    remoteReady.current = false
    if (!supabaseEnabled || !user) { setStatus('local'); return }
    let cancelled = false
    setStatus('syncing')
    fetchProfile(user.uid)
      .then(async (row) => {
        if (cancelled) return
        const remote = row?.[key]
        const merged = remote ? merge(latest.current, remote) : latest.current
        setValue(merged)
        await pushWithRetry(user.uid, key, merged)
        remoteReady.current = true
        if (!cancelled) setStatus('synced')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => { cancelled = true }
  }, [user?.uid, key]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (nextOrFn) => {
      setValue((prev) => {
        const next = typeof nextOrFn === 'function' ? nextOrFn(prev) : nextOrFn
        if (supabaseEnabled && user && remoteReady.current) {
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            setStatus('syncing')
            pushWithRetry(user.uid, key, latest.current)
              .then(() => setStatus('synced'))
              .catch(() => setStatus('error'))
          }, debounceMs)
        }
        return next
      })
    },
    [user, key, debounceMs],
  )

  return { value, set, status }
}

async function pushWithRetry(uid, key, data, attempts = 3) {
  let delay = 800
  for (let i = 0; i < attempts; i++) {
    try {
      await upsertProfile(uid, { [key]: data })
      return
    } catch (e) {
      if (i === attempts - 1) throw e
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
}
