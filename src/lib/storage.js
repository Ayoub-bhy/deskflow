/**
 * Versioned localStorage. Every value is stored as { v, data } so shapes can
 * evolve: pass `migrate(oldVersion, data) → data` and bump `version` when a
 * key's shape changes. Legacy unversioned values are treated as version 0.
 */
const PREFIX = 'deskflow:'

export function load(key, fallback, { version = 1, migrate } = {}) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    const isEnvelope = parsed && typeof parsed === 'object' && 'v' in parsed && 'data' in parsed && Object.keys(parsed).length === 2
    let v = isEnvelope ? parsed.v : 0
    let data = isEnvelope ? parsed.data : parsed
    while (v < version && migrate) {
      data = migrate(v, data)
      v++
    }
    return data ?? fallback
  } catch {
    return fallback
  }
}

export function save(key, data, { version = 1 } = {}) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: version, data }))
  } catch {
    /* quota / private mode */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/**
 * Cross-tab sync: fires `cb(data)` when another tab writes this key.
 * (The `storage` event never fires in the tab that made the change.)
 */
export function onExternalChange(key, cb, opts) {
  const handler = (e) => {
    if (e.key !== PREFIX + key || e.newValue == null) return
    cb(load(key, undefined, opts))
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

export function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base
  const out = { ...base }
  for (const k of Object.keys(patch)) {
    out[k] = base && typeof base[k] === 'object' && !Array.isArray(base[k]) && base[k] !== null ? deepMerge(base[k], patch[k]) : patch[k]
  }
  return out
}
