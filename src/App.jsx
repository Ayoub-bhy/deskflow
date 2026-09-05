import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSettings } from './hooks/useSettings'
import { useNow } from './hooks/useNow'
import { useReminder } from './hooks/useReminder'
import { usePomodoro } from './hooks/usePomodoro'
import { useHistory } from './hooks/useHistory'
import { chime, notify, unlockAudio, requestNotifications, notificationsSupported } from './lib/alerts'
import { inQuietHours } from './lib/time'
import { TIPS } from './lib/defaults'
import { load, save } from './lib/storage'
import Landing from './components/Landing'
import Header from './components/Header'
import ReminderCard from './components/ReminderCard'
import PomodoroCard from './components/PomodoroCard'
import BreakOverlay from './components/BreakOverlay'
import SettingsPanel from './components/SettingsPanel'
import ProgressBoard from './components/ProgressBoard'

export default function App() {
  const auth = useAuth()
  const [guest, setGuest] = useState(() => load('guest', false))
  useEffect(() => save('guest', guest), [guest])

  const { settings, update, reset, syncState } = useSettings(auth.user)
  const hist = useHistory(auth.user)
  const record = hist.record
  const now = useNow(1000)

  const [banner, setBanner] = useState(null) // { kind, text }
  const [breakOpen, setBreakOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [armed, setArmed] = useState(() => load('armed', false)) // user clicked once → audio/notifications unlocked

  const alert = useCallback(
    (title, body, tag) => {
      if (settings.alerts.sound) chime(settings.alerts.volume)
      if (settings.alerts.notifications && document.visibilityState !== 'visible') notify(title, body, tag)
      setBanner({ tag, text: `${title} — ${body}` })
      document.title = `⏰ ${title} · DeskFlow`
    },
    [settings.alerts],
  )

  const onDue = useCallback(
    (kind) =>
      kind === 'move'
        ? alert('Time to move', 'Stand up for a 3-minute stretch.', 'move')
        : alert('Water break', 'A few sips, then back to it.', 'water'),
    [alert],
  )

  const move = useReminder('move', settings.move, now, settings.quietHours, onDue, record)
  const water = useReminder('water', settings.water, now, settings.quietHours, onDue, record)

  const onPhaseEnd = useCallback(
    (phase) => {
      if (phase === 'focus') {
        record('focus')
        alert('Focus block done', 'Take your break — stand up while you’re at it.', 'pomo')
      } else alert('Break over', 'Ready for the next focus block?', 'pomo')
    },
    [alert, record],
  )
  const pomo = usePomodoro(settings.pomodoro, now, onPhaseEnd)

  // Restore the tab title once nothing is due.
  useEffect(() => {
    if (!move.due && !water.due && !banner) document.title = 'DeskFlow'
  }, [move.due, water.due, banner])

  const quiet = inQuietHours(settings.quietHours, new Date(now))
  const tip = useMemo(() => TIPS[Math.floor(now / 3_600_000) % TIPS.length], [now])

  const arm = async () => {
    unlockAudio()
    setArmed(true)
    save('armed', true)
    if (notificationsSupported() && Notification.permission === 'default') {
      const r = await requestNotifications()
      update({ alerts: { notifications: r === 'granted' } })
    }
  }

  if (auth.loading) return <div className="splash">Loading…</div>
  if (!auth.user && !guest) return <Landing auth={auth} onGuest={() => setGuest(true)} />

  return (
    <div className="app" onClickCapture={() => !armed && unlockAudio()}>
      <Header auth={auth} syncState={syncState} onSettings={() => setSettingsOpen(true)} onLeaveGuest={() => setGuest(false)} />

      {!armed && (
        <div className="notice">
          <span>Reminders need one click to unlock sound and desktop notifications.</span>
          <button className="btn primary small" onClick={arm}>Enable reminders</button>
        </div>
      )}
      {armed && quiet && settings.quietHours.enabled && (
        <div className="notice quiet">Quiet hours — Move and Water reminders are paused. Pomodoro still works.</div>
      )}
      {banner && (
        <div className={`toast toast-${banner.tag}`} role="status">
          <span>{banner.text}</span>
          <button className="btn ghost small" onClick={() => setBanner(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <main className="grid">
        <ReminderCard
          kind="move"
          cfg={settings.move}
          r={move}
          onToggle={(enabled) => update({ move: { enabled } })}
          onIntervalChange={(intervalMin) => update({ move: { intervalMin } })}
          onOpenBreak={() => { setBanner(null); setBreakOpen(true) }}
        />
        <ReminderCard
          kind="water"
          cfg={settings.water}
          r={water}
          onToggle={(enabled) => update({ water: { enabled } })}
          onIntervalChange={(intervalMin) => update({ water: { intervalMin } })}
        />
        <PomodoroCard cfg={settings.pomodoro} p={pomo} onChange={(patch) => update({ pomodoro: patch })} />
        <ProgressBoard today={hist.today} week={hist.week} streak={hist.streak} />
        <section className="card tip">
          <h2>💡 Desk tip</h2>
          <p>{tip}</p>
        </section>
      </main>

      <footer className="foot muted small">
        Runs while this tab is open — pin it, or install DeskFlow as an app from your browser menu. Sleep and background throttling are handled.
      </footer>

      {breakOpen && (
        <BreakOverlay
          sound={() => settings.alerts.sound && chime(settings.alerts.volume * 0.5)}
          onDone={() => { move.done(); setBreakOpen(false); setBanner(null) }}
          onClose={() => setBreakOpen(false)}
        />
      )}
      {settingsOpen && <SettingsPanel settings={settings} update={update} reset={reset} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
