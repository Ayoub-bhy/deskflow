import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, googleProvider, firebaseEnabled } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(firebaseEnabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!firebaseEnabled) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = useCallback(async () => {
    if (!firebaseEnabled) return
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // Popup blockers / iOS Safari → fall back to redirect.
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider)
      } else if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        setError(e?.message || 'Sign-in failed')
      }
    }
  }, [])

  const logout = useCallback(() => (firebaseEnabled ? signOut(auth) : Promise.resolve()), [])

  return { user, loading, error, signIn, logout, enabled: firebaseEnabled }
}
