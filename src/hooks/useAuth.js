import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseEnabled } from '../supabase'

/** Google sign-in through Supabase Auth. `user` is normalised to { uid, email, displayName, photoURL }. */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseEnabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabaseEnabled) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(normalise(data.session?.user))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(normalise(session?.user))
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async () => {
    if (!supabaseEnabled) return
    setError(null)
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Come back to exactly this page (works for localhost, GitHub Pages sub-path, or a custom domain).
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (e) setError(e.message)
  }, [])

  const logout = useCallback(() => (supabaseEnabled ? supabase.auth.signOut() : Promise.resolve()), [])

  return { user, loading, error, signIn, logout, enabled: supabaseEnabled }
}

function normalise(u) {
  if (!u) return null
  const m = u.user_metadata || {}
  return { uid: u.id, email: u.email, displayName: m.full_name || m.name || null, photoURL: m.avatar_url || m.picture || null }
}
