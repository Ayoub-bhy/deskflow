import { useCallback } from 'react'
import { useSyncedDoc } from './useSyncedDoc'
import { DEFAULT_SETTINGS, SETTINGS_VERSION, migrateSettings } from '../lib/defaults'
import { deepMerge } from '../lib/storage'

/** Settings: local-first, mirrored to profiles.settings when signed in. Remote wins field-by-field on sign-in. */
export function useSettings(user) {
  const { value, set, status } = useSyncedDoc(
    'settings',
    DEFAULT_SETTINGS,
    { merge: (local, remote) => deepMerge(local, remote), version: SETTINGS_VERSION, migrate: migrateSettings, debounceMs: 800 },
    user,
  )
  const settings = deepMerge(DEFAULT_SETTINGS, value) // new kinds/fields always present
  const update = useCallback((patch) => set((prev) => deepMerge(prev, patch)), [set])
  const reset = useCallback(() => set(DEFAULT_SETTINGS), [set])
  return { settings, update, reset, syncState: status }
}
