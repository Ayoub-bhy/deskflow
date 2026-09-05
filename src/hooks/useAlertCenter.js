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

  const raise = useCallback(
    (key, tag) => {
      const [title, body] = t(`alerts.${key}`)
      if (alertsCfg.sound) chime(alertsCfg.volume)
      if (alertsCfg.notifications && document.visibilityState !== 'visible') notify(title, body, tag)
      setBanner({ tag, text: `${title} — ${body}` })
      document.title = `(!) ${title} · DeskFlow`
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
  const raiseStable = useCallback((key, tag) => raiseRef.current(key, tag), [])

  return { banner, raise, raiseStable, dismiss, setAnyDue }
}
