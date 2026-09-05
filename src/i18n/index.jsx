import { createContext, useContext, useEffect, useMemo } from 'react'
import en from './en'
import ar from './ar'
import fr from './fr'

export const LANGS = { en, ar, fr }

const Ctx = createContext({ t: (k) => k, lang: 'en', dict: en })

/** Resolve "a.b.c" in a dictionary, falling back to English. */
function get(dict, key) {
  return key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), dict)
}

export function I18nProvider({ lang, children }) {
  const dict = LANGS[lang] || en
  const value = useMemo(() => {
    const t = (key, vars) => {
      let v = get(dict, key)
      if (v === undefined) v = get(en, key)
      if (v === undefined) return key
      if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, n) => (vars[n] ?? `{${n}}`))
      return v
    }
    return { t, lang: dict.meta.locale, dir: dict.meta.dir, dict }
  }, [dict])

  useEffect(() => {
    document.documentElement.lang = dict.meta.locale
    document.documentElement.dir = dict.meta.dir
  }, [dict])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useT = () => useContext(Ctx)

export function detectLang() {
  const nav = (navigator.language || 'en').slice(0, 2)
  return nav in LANGS ? nav : 'en'
}
