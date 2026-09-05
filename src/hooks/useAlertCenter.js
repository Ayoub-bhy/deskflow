import { useCallback, useEffect, useRef, useState } from 'react'
import { chime, notify } from '../lib/alerts'

/**
 * Owns every side effect of "something needs your attention":
 * chime, desktop notification (only when the tab is hidden), in-page banner,
 * and the tab-title flag. Components just call `raise(key, tag)`.
 */
export function useAlertCenter(alertsCfg, t) {
  const [banner, setBanner] = useState(null)
  const anyDueRef = useRef(false)

  /**
   * raise(key, tag, vars?, opts?) — opts.sound overrides the global sound
   * (faith alerts have their own toggle); opts.discreet swaps the visible text
   * for a neutral "Reminder" so onlookers see nothing specific.
   */
  const raise = useCallback(
    (key, tag, vars, opts = {}) => {
      const fill = (s) => (vars ? s.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? '') : s)
      const [title, body] = t(`alerts.${key}`).map(fill)
      const [dTitle, dBody] = opts.discreet ? t('alerts.discreet') : [title, body]
      const sound = opts.sound ?? alertsCfg.sound
      if (sound) chime(alertsCfg.volume)
      if (alertsCfg.notifications && document.visibilityState !== 'visible') notify(dTitle, dBody, tag)
      setBanner({ tag, text: `${dTitle} — ${dBody}`, full: opts.discreet ? `${title} — ${body}` : null })
      document.title = `(!) ${dTitle} · DeskFlow`
    },
    [alertsCfg, t],
  )

  const dismiss = useCallback(() => setBanner(null), [])

  /** Call each render with whether anything is still due; clears the title flag when nothing is. */
  const setAnyDue = useCallback((v) => { anyDueRef.current = v }, [])
  useEffect(() => {
    if (!anyDueRef.current && !banner) document.title = 'DeskFlow'
  })

  // Stable callback for hooks that must not re-subscribe when settings/language change.
  const raiseRef = useRef(raise)
  raiseRef.current = raise
  const raiseStable = useCallback((key, tag, vars, opts) => raiseRef.current(key, tag, vars, opts), [])

  return { banner, raise, raiseStable, dismiss, setAnyDue }
}
