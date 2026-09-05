import { notificationsSupported, requestNotifications, unlockAudio, chime } from '../lib/alerts'
import Icon from './Icon'
import { useT, LANGS } from '../i18n'
import { REMINDER_KINDS } from '../reminders/registry'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function SettingsPanel({ settings, update, reset, onClose, lang, onLang, startedAt, onExport }) {
  const { t } = useT()
  const { quietHours: q, alerts: a } = settings
  const perm = notificationsSupported() ? Notification.permission : 'unsupported'
  const days = t('board.days')

  const enableNotifications = async () => {
    unlockAudio()
    const res = await requestNotifications()
    update({ alerts: { notifications: res === 'granted' } })
  }

  return (
    <aside className="drawer" role="dialog" aria-label={t('settings.title')}>
      <header className="drawer-head">
        <h2>{t('settings.title')}</h2>
        <button className="btn ghost small" onClick={onClose} aria-label={t('settings.close')}><Icon name="close" size={16} /></button>
      </header>

      <section>
        <h3>{t('settings.language')}</h3>
        <div className="daypick">
          {Object.entries(LANGS).map(([k, v]) => (
            <button key={k} type="button" className={`day ${lang === k ? 'on' : ''}`} onClick={() => onLang(k)}>{v.meta.name}</button>
          ))}
        </div>
      </section>

      <section>
        <h3>{t('settings.alerts')}</h3>
        <label className="check">
          <input type="checkbox" checked={a.sound} onChange={(e) => { unlockAudio(); update({ alerts: { sound: e.target.checked } }) }} />
          {t('settings.sound')}
        </label>
        <label className="field row">
          <span>{t('settings.volume')}</span>
          <input type="range" min="0" max="1" step="0.1" value={a.volume} onChange={(e) => update({ alerts: { volume: Number(e.target.value) } })} onMouseUp={() => chime(a.volume)} />
        </label>
        <div className="notif-row">
          {perm === 'granted' ? (
            <label className="check">
              <input type="checkbox" checked={a.notifications} onChange={(e) => update({ alerts: { notifications: e.target.checked } })} />
              {t('settings.notifications')}
            </label>
          ) : perm === 'denied' ? (
            <p className="muted small">{t('settings.notifBlocked')}</p>
          ) : perm === 'unsupported' ? (
            <p className="muted small">{t('settings.notifUnsupported')}</p>
          ) : (
            <button className="btn" onClick={enableNotifications}>{t('settings.enableNotif')}</button>
          )}
        </div>
        <p className="muted small">{t('settings.runsNote')}</p>
      </section>

      <section>
        <h3>{t('settings.quiet')}</h3>
        <label className="check">
          <input type="checkbox" checked={q.enabled} onChange={(e) => update({ quietHours: { enabled: e.target.checked } })} />
          {t('settings.quietToggle')}
        </label>
        <div className="fields">
          <label className="field"><span>{t('settings.from')}</span><input type="time" value={q.start} onChange={(e) => update({ quietHours: { start: e.target.value } })} /></label>
          <label className="field"><span>{t('settings.until')}</span><input type="time" value={q.end} onChange={(e) => update({ quietHours: { end: e.target.value } })} /></label>
        </div>
        <p className="muted small" style={{ marginTop: '0.8rem' }}>{t('settings.workDays')}</p>
        <div className="daypick" role="group" aria-label={t('settings.workDays')}>
          {DAY_ORDER.map((d) => {
            const cur = q.workDays ?? [1, 2, 3, 4, 5]
            const on = cur.includes(d)
            return (
              <button key={d} type="button" className={`day ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => { const next = on ? cur.filter((x) => x !== d) : [...cur, d].sort(); if (next.length) update({ quietHours: { workDays: next } }) }}>
                {days[d]}
              </button>
            )
          })}
        </div>
        <p className="muted small">{t('settings.workDaysNote')}</p>
      </section>

      <section>
        <h3>{t('settings.snooze')}</h3>
        <div className="fields">
          {REMINDER_KINDS.map(({ id: k }) => (
            <label key={k} className="field"><span>{t(`reminder.${k}.title`)}</span><input type="number" min="1" max="60" value={settings[k].snoozeMin} onChange={(e) => update({ [k]: { snoozeMin: Number(e.target.value) || 5 } })} /></label>
          ))}
        </div>
      </section>

      <section>
        <h3>{t('settings.data')}</h3>
        {startedAt && <p className="muted small">{t('settings.since', { d: new Date(startedAt + 'T12:00:00').toLocaleDateString(lang) })}</p>}
        <button className="btn small with-icon" onClick={onExport}><Icon name="install" size={16} /> {t('settings.exportCsv')}</button>
      </section>

      <section>
        <button className="btn ghost small" onClick={reset}>{t('settings.reset')}</button>
      </section>
    </aside>
  )
}
