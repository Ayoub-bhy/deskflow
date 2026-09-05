import { notificationsSupported, requestNotifications, unlockAudio, chime } from '../lib/alerts'

export default function SettingsPanel({ settings, update, reset, onClose }) {
  const { quietHours: q, alerts: a, move, water } = settings
  const perm = notificationsSupported() ? Notification.permission : 'unsupported'

  const enableNotifications = async () => {
    unlockAudio()
    const res = await requestNotifications()
    update({ alerts: { notifications: res === 'granted' } })
  }

  return (
    <aside className="drawer" role="dialog" aria-label="Settings">
      <header className="drawer-head">
        <h2>Settings</h2>
        <button className="btn ghost small" onClick={onClose} aria-label="Close">✕</button>
      </header>

      <section>
        <h3>Alerts</h3>
        <label className="check">
          <input type="checkbox" checked={a.sound} onChange={(e) => { unlockAudio(); update({ alerts: { sound: e.target.checked } }) }} />
          Sound chime
        </label>
        <label className="field row">
          <span>Volume</span>
          <input type="range" min="0" max="1" step="0.1" value={a.volume} onChange={(e) => update({ alerts: { volume: Number(e.target.value) } })} onMouseUp={() => chime(a.volume)} />
        </label>
        <div className="notif-row">
          {perm === 'granted' ? (
            <label className="check">
              <input type="checkbox" checked={a.notifications} onChange={(e) => update({ alerts: { notifications: e.target.checked } })} />
              Desktop notifications
            </label>
          ) : perm === 'denied' ? (
            <p className="muted small">Notifications are blocked for this site. Allow them in the browser’s site settings (lock icon in the address bar), then reload.</p>
          ) : perm === 'unsupported' ? (
            <p className="muted small">This browser doesn’t support notifications — you’ll get the in-page banner and chime.</p>
          ) : (
            <button className="btn" onClick={enableNotifications}>Enable desktop notifications</button>
          )}
        </div>
        <p className="muted small">Reminders run while DeskFlow is open (a pinned tab or the installed app is fine — laptop sleep is handled).</p>
      </section>

      <section>
        <h3>Quiet hours</h3>
        <label className="check">
          <input type="checkbox" checked={q.enabled} onChange={(e) => update({ quietHours: { enabled: e.target.checked } })} />
          Pause reminders outside work hours
        </label>
        <div className="fields">
          <label className="field"><span>From</span><input type="time" value={q.start} onChange={(e) => update({ quietHours: { start: e.target.value } })} /></label>
          <label className="field"><span>Until</span><input type="time" value={q.end} onChange={(e) => update({ quietHours: { end: e.target.value } })} /></label>
        </div>
        <label className="check">
          <input type="checkbox" checked={q.weekdaysOnly} onChange={(e) => update({ quietHours: { weekdaysOnly: e.target.checked } })} />
          Weekdays only
        </label>
      </section>

      <section>
        <h3>Snooze lengths</h3>
        <div className="fields">
          <label className="field"><span>Move</span><input type="number" min="1" max="30" value={move.snoozeMin} onChange={(e) => update({ move: { snoozeMin: Number(e.target.value) || 5 } })} /></label>
          <label className="field"><span>Water</span><input type="number" min="1" max="30" value={water.snoozeMin} onChange={(e) => update({ water: { snoozeMin: Number(e.target.value) || 10 } })} /></label>
        </div>
      </section>

      <section>
        <button className="btn ghost small" onClick={reset}>Reset to defaults</button>
      </section>
    </aside>
  )
}
