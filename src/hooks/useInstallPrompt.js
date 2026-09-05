import { useEffect, useState, useCallback } from 'react'

/** Captures Chrome/Edge/Android's beforeinstallprompt so we can show our own Install button. */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e) }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  const prompt = useCallback(async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice.catch(() => {})
    setDeferred(null)
  }, [deferred])

  return { canInstall: Boolean(deferred), prompt, installed, isIOS }
}
