import { supabase, supabaseEnabled } from '../supabase'

/**
 * Thin data layer over the `profiles` table (one row per user, RLS-protected):
 *   id uuid (= auth.uid()), settings jsonb, history jsonb, updated_at timestamptz
 * Also writes an append-only `events` row per action for analytics.
 */
export async function fetchProfile(uid) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.from('profiles').select('settings, history').eq('id', uid).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile(uid, patch) {
  if (!supabaseEnabled) return
  const { error } = await supabase.from('profiles').upsert({ id: uid, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
}

export function logEvent(uid, kind, meta = {}) {
  if (!supabaseEnabled || !uid) return
  // Fire-and-forget; never block the UI on analytics.
  supabase.from('events').insert({ user_id: uid, kind, meta }).then(({ error }) => error && console.warn('event insert failed', error.message))
}
