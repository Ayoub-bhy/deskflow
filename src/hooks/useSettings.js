import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, firebaseEnabled } from '../firebase'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { load, save, deepMerge } from '../lib/storage'

/**
 * Settings live in localStorage always (guest-first). When a user is signed
 * in, the same object is mirrored to Firestore `users/{uid}` — settings only,
 * never ticking timer state. Firestore writes are debounced so dragging a
 * slider costs one write, not fifty (free tier: 20k writes/day).
 */
export function useSettings(user) {
  const [settings, setSettings] = useState(() => deepMerge(DEFAULT_SETTINGS, load('settings', {})))
  const [syncState, setSyncState] = useState('local') // local | syncing | synced | error
  const pendingWrite = useRef(null)
  const remoteApplied = useRef(false)

  // Persist locally on every change.
  useEffect(() => save('settings', settings), [settings])

  // Subscribe to the remote doc while signed in.
  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setSyncState('local')
      remoteApplied.current = false
      return
    }
    const ref = doc(db, 'users', user.uid)
    setSyncState('syncing')
    let unsub = () => {}
    ;(async () => {
      try {
        const snap = await getDoc(ref)
        if (snap.exists() && snap.data().settings) {
          // Remote wins on first sign-in of this device.
          setSettings((s) => deepMerge(s, snap.data().settings))
        } else {
          // First ever sign-in: seed the cloud with local settings.
          await setDoc(ref, { settings, updatedAt: serverTimestamp(), email: user.email ?? null }, { merge: true })
        }
        remoteApplied.current = true
        setSyncState('synced')
        unsub = onSnapshot(ref, (d) => {
          const remote = d.data()?.settings
          if (remote && !d.metadata.hasPendingWrites) setSettings((s) => deepMerge(s, remote))
        })
      } catch (e) {
        console.warn('settings sync failed', e)
        setSyncState('error')
      }
    })()
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const update = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = deepMerge(prev, patch)
        if (firebaseEnabled && user && remoteApplied.current) {
          clearTimeout(pendingWrite.current)
          pendingWrite.current = setTimeout(() => {
            setSyncState('syncing')
            setDoc(doc(db, 'users', user.uid), { settings: next, updatedAt: serverTimestamp() }, { merge: true })
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
