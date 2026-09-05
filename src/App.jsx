import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSettings } from './hooks/useSettings'
import { useNow } from './hooks/useNow'
import { useReminders } from './hooks/useReminders'
import { usePomodoro } from './hooks/usePomodoro'
import { useHistory } from './hooks/useHistory'
import { useAlertCenter } from './hooks/useAlertCenter'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { chime, unlockAudio, requestNotifications, notificationsSupported } from './lib/alerts'
import { inQuietHours } from './lib/time'
import { load, save } from './lib/storage'
import { REMINDER_KINDS, byId, visibleKinds } from './reminders/registry'
import { usePrayer } from './faith/usePrayer'
import FaithPrompt from './faith/FaithPrompt'
import PrayerCard from './faith/PrayerCard'
import FaithCard from './faith/FaithCard'
import DhikrOverlay from './faith/DhikrOverlay'
import { I18nProvider, useT, detectLang } from './i18n'
import Landing from './components/Landing'
import Header from './components/Header'
import ReminderCard from './components/ReminderCard'
import PomodoroCard from './components/PomodoroCard'
import BreakOverlay from './components/BreakOverlay'
import MindOverlay from './components/MindOverlay'
import SettingsPanel from './components/SettingsPanel'
import ProgressBoard from './components/ProgressBoard'
import AdviceCard from './components/AdviceCard'
import HistoryView from './components/HistoryView'
import Icon from './components/Icon'

const OVERLAYS = { move: BreakOverlay, mind: MindOverlay, dhikr: DhikrOverlay }

export default function App() {
  const auth = useAuth()
  const { settings, update, reset, syncState } = useSettings(auth.user)
  const lang = settings.lang || detectLang()
  return (
    <I18nProvider lang={lang}>
      <Shell auth={auth} settings={settings} update={update} reset={reset} syncState={syncState} lang={lang} onLang={(l) => update({ lang: l })} />
    </I18nProvider>
  )
}

/** Composition only: hooks own the behaviour, components own the pixels. */
function Shell({ auth, settings, update, reset, syncState, lang, onLang }) {
  const { t } = useT()
  const now = useNow(1000)
  const [guest, setGuest] = useState(() => load('guest', false))
  const [armed, setArmed] = useState(() => load('armed', false))
  const [view, setView] = useState('dash') // dash | history
  const [overlay, setOverlay] = useState(null) // 'move' | 'mind' | null
  const [settingsOpen, setSettingsOpen] = useState(false)
  useEffect(() => save('guest', guest), [guest])

  const hist = useHistory(auth.user, now)
  const alerts = useAlertCenter(settings.alerts, t)

  // Faith layer: opt-in, private, silent unless its own sound toggle is on.
  const faith = settings.faith
  const faithOn = faith.enabled === true
  const [faithHidden, setFaithHidden] = useState(false) // "hide for this session" (demo / screen-share)
  const kinds = visibleKinds(faithOn)
  const activeIds = REMINDER_KINDS.filter((k) => faithOn || !k.faith).map((k) => k.id)
  const P = t('faith.prayers')
  const onPrayerAlert = useCallback((key, p) => {
    const name = p.isJumuah ? t('faith.jumuah') : P[p.name]
    const mins = Math.max(1, Math.round((p.at - Date.now()) / 60000))
    alerts.raiseStable(key, 'prayer', { p: name, m: mins }, { sound: faith.sound, discreet: faith.discreet })
    if (key === 'prayer') hist.record('prayer')
  }, [alerts.raiseStable, t, P, faith.sound, faith.discreet, hist.record]) // eslint-disable-line react-hooks/exhaustive-deps
  const prayer = usePrayer(faith.prayer, faithOn, now, onPrayerAlert)
  const prayerPause = faithOn && faith.prayer.pauseOthers && Boolean(prayer.window)

  const onDue = useCallback((id) => {
    const isFaith = Boolean(byId[id].faith)
    alerts.raiseStable(id, id, undefined, isFaith ? { sound: faith.sound, discreet: faith.discreet } : undefined)
  }, [alerts.raiseStable, faith.sound, faith.discreet])
  const reminders = useReminders(settings, now, settings.quietHours, onDue, hist.record, { paused: prayerPause, active: activeIds })
  alerts.setAnyDue(activeIds.some((id) => reminders[id].due))
  const { record } = hist
  const { raiseStable } = alerts
  const onPhaseEnd = useCallback((phase) => {
    if (phase === 'focus') { record('focus'); raiseStable('focusDone', 'pomo') } else raiseStable('breakDone', 'pomo')
  }, [record, raiseStable])
  const pomo = usePomodoro(settings.pomodoro, now, onPhaseEnd)
  const install = useInstallPrompt()
  const quiet = inQuietHours(settings.quietHours, new Date(now))

  const arm = async () => {
    unlockAudio(); setArmed(true); save('armed', true)
    if (notificationsSupported() && Notification.permission === 'default') {
      update({ alerts: { notifications: (await requestNotifications()) === 'granted' } })
    }
  }
  const exportCsv = () => downloadText(`deskflow-history-${new Date().toISOString().slice(0, 10)}.csv`, hist.toCsv(), 'text/csv')
  const openOverlay = (id) => { alerts.dismiss(); setOverlay(id) }

  if (auth.loading) return <div className="splash">{t('app.loading')}</div>
  if (!auth.user && !guest) return <Landing auth={auth} onGuest={() => setGuest(true)} lang={lang} onLang={onLang} />

  const Overlay = overlay ? OVERLAYS[overlay] : null

  return (
    <div className="app" onClickCapture={() => !armed && unlockAudio()}>
      <Header auth={auth} syncState={syncState} lang={lang} onLang={onLang} onSettings={() => setSettingsOpen(true)} onHistory={() => setView((v) => (v === 'history' ? 'dash' : 'history'))} onLeaveGuest={() => setGuest(false)} />

      {view === 'history' ? (
        <HistoryView stats={hist.stats} onBack={() => setView('dash')} onExport={exportCsv} kinds={kinds} />
      ) : (
        <>
          {!armed && (
            <div className="notice">
              <span>{t('notice.arm')}</span>
              <button className="btn primary small" onClick={arm}>{t('notice.armBtn')}</button>
            </div>
          )}
          {armed && quiet && settings.quietHours.enabled && <div className="notice quiet">{t('notice.quiet')}</div>}
          {alerts.banner && (
            <div className={`toast toast-${alerts.banner.tag}`} role="status" title={alerts.banner.full || undefined}>
              <span>{alerts.banner.text}</span>
              <button className="btn ghost small" onClick={alerts.dismiss} aria-label={t('routine.close')}><Icon name="close" size={16} /></button>
            </div>
          )}

          <main className="grid">
            {faith.enabled === null && !faithHidden && <FaithPrompt onAnswer={(a) => (a === 'later' ? setFaithHidden(true) : update({ faith: { enabled: a } }))} />}
            {faithOn && !faithHidden && (
              <PrayerCard prayer={prayer} cfg={faith.prayer} now={now} onChange={(patch) => update({ faith: { prayer: patch } })} onHide={() => setFaithHidden(true)} />
            )}
            {REMINDER_KINDS.filter((k) => activeIds.includes(k.id) && !(k.faith && faithHidden)).map((k) => (
              <ReminderCard
                key={k.id}
                kind={k.id}
                cfg={settings[k.id]}
                r={reminders[k.id]}
                onToggle={(enabled) => update({ [k.id]: { enabled } })}
                onIntervalChange={(intervalMin) => update({ [k.id]: { intervalMin } })}
                onOpen={k.overlay ? () => openOverlay(k.id) : undefined}
              />
            ))}
            <PomodoroCard cfg={settings.pomodoro} p={pomo} onChange={(patch) => update({ pomodoro: patch })} />
            <ProgressBoard today={hist.today} week={hist.week} streak={hist.streak} onHistory={() => setView('history')} kinds={kinds} />
            {faithOn && !faithHidden && (faith.daily.ayah || faith.daily.hadith) && <FaithCard now={now} daily={faith.daily} />}
            <AdviceCard quietHours={settings.quietHours} now={now} faith={faithOn} />
            {faithOn && faithHidden && <p className="muted small center"><button className="btn ghost small" onClick={() => setFaithHidden(false)}>{t('faith.showSession')}</button></p>}
          </main>

          <footer className="foot muted small">
            {install.canInstall ? (
              <button className="btn small with-icon" onClick={install.prompt}><Icon name="install" size={16} /> {t('footer.install')}</button>
            ) : install.isIOS && !install.installed ? t('footer.ios') : install.installed ? t('footer.installed') : t('footer.tab')}
          </footer>
        </>
      )}

      {Overlay && (
        <Overlay
          faith={faithOn}
          sound={() => settings.alerts.sound && chime(settings.alerts.volume * (byId[overlay].chime ?? 0.5))}
          onDone={() => { reminders[overlay].done(); setOverlay(null); alerts.dismiss() }}
          onClose={() => setOverlay(null)}
        />
      )}
      {settingsOpen && <SettingsPanel settings={settings} update={update} reset={reset} lang={lang} onLang={onLang} startedAt={hist.stats.startedAt} onExport={exportCsv} onClose={() => setSettingsOpen(false)} prayerStatus={prayer.status} />}
    </div>
  )
}

function downloadText(name, text, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
