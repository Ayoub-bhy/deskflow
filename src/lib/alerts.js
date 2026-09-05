// Sound + notification helpers.
// Both browser APIs need a user gesture first: call `unlockAudio()` and
// `requestNotifications()` from a click handler, never on page load.

let ctx = null

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    /* no audio */
  }
}

/** A short, soft two-tone chime synthesised with WebAudio (no asset needed). */
export function chime(volume = 0.6) {
  try {
    if (!ctx) unlockAudio()
    if (!ctx) return
    const t = ctx.currentTime
    ;[[523.25, 0], [783.99, 0.18]].forEach(([freq, dt]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0, t + dt)
      g.gain.linearRampToValueAtTime(volume * 0.3, t + dt + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.6)
      o.connect(g).connect(ctx.destination)
      o.start(t + dt)
      o.stop(t + dt + 0.7)
    })
  } catch {
    /* ignore */
  }
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotifications() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function notify(title, body, tag) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return null
  try {
    // Prefer the service-worker registration so the notification survives a
    // minimised window; fall back to the page-level constructor.
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) =>
        reg.showNotification(title, { body, tag, icon: '/icon.svg', badge: '/icon.svg', renotify: true, requireInteraction: false }),
      )
      return true
    }
    const n = new Notification(title, { body, tag, icon: '/icon.svg' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
    return n
  } catch {
    return null
  }
}
