import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseEnabled } from '../supabase'
import { fetchProfile, upsertProfile } from '../lib/cloud'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { load, save, deepMerge } from '../lib/storage'

/**
 * Settings live in localStorage always (guest-first). When signed in, the same
 * object is mirrored to Supabase `profiles.settings` — settings only, never
 * ticking timer state. Writes are debounced so a slider drag costs one request.
 */
export function useSettings(user) {
  const [settings, setSettings] = useState(() => deepMerge(DEFAULT_SETTINGS, load('settings', {})))
  const [syncState, setSyncState] = useState('local') // local | syncing | synced | error
  const pendingWrite = useRef(null)
  const remoteReady = useRef(false)

  useEffect(() => save('settings', settings), [settings])

  useEffect(() => {
    remoteReady.current = false
    if (!supabaseEnabled || !user) {
      setSyncState('local')
      return
    }
    setSyncState('syncing')
    fetchProfile(user.uid)
      .then(async (row) => {
        if (row?.settings) {
          setSettings((s) => deepMerge(s, row.settings)) // remote wins on first sign-in of this device
        } else {
          await upsertProfile(user.uid, { settings }) // first ever sign-in: seed the cloud with local settings
        }
        remoteReady.current = true
        setSyncState('synced')
      })
      .catch((e) => {
        console.warn('settings sync failed', e)
        setSyncState('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const update = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = deepMerge(prev, patch)
        if (supabaseEnabled && user && remoteReady.current) {
          clearTimeout(pendingWrite.current)
          pendingWrite.current = setTimeout(() => {
            setSyncState('syncing')
            upsertProfile(user.uid, { settings: next })
              .then(() => setSyncState('synced'))
              .catch(() => setSyncState('error'))
          }, 800)
        }
        return next
      })
    },
    [user],
  )

  const reset = useCallback(() => update(DEFAULT_SETTINGS), [update])

  return { settings, update, reset, syncState }
}
