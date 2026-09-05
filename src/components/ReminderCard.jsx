import Ring from './Ring'
import Icon from './Icon'
import { fmtRelative } from '../lib/time'
import { useT } from '../i18n'
import { byId } from '../reminders/registry'

export default function ReminderCard({ kind, cfg, r, onToggle, onIntervalChange, onOpen }) {
  const { t } = useT()
  const m = byId[kind]
  const k = `reminder.${kind}`
  return (
    <section className={`card reminder ${r.due ? 'is-due' : ''} ${!cfg.enabled ? 'is-off' : ''}`} aria-live="polite">
      <header className="card-head">
        <h2 className="with-icon">
          <span className={`icon-badge badge-${m.tone}`}><Icon name={m.icon} size={18} /></span> {t(`${k}.title`)}
        </h2>
        <label className="switch">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span />
        </label>
      </header>

      <div className="reminder-body">
        <Ring progress={cfg.enabled ? r.progress : 0} tone={m.tone} size={124}>
          {!cfg.enabled ? (
            <span className="muted small">{t('reminder.off')}</span>
          ) : r.due ? (
            <strong className="due-label">{t('reminder.now')}</strong>
          ) : (
            <>
              <strong>{fmtRelative(r.remainingMs, t)}</strong>
              <span className="muted small">{t('reminder.untilNext')}</span>
            </>
          )}
        </Ring>

        <div className="reminder-info">
          {r.due ? (
            <>
              <p className="lead">
                {t(`${k}.verb`)}
                {r.overdueMs > 90_000 && <span className="muted"> · {t('reminder.dueAgo', { t: fmtRelative(r.overdueMs, t) })}</span>}
              </p>
              <div className="actions">
                {onOpen && <button className="btn primary" onClick={onOpen}>{t(`${k}.start`)}</button>}
                <button className="btn" onClick={r.done}>{t(`${k}.done`)}</button>
                <button className="btn ghost" onClick={() => r.snooze()}>{t('reminder.snooze', { n: cfg.snoozeMin })}</button>
                <button className="btn ghost" onClick={r.skip}>{t('reminder.skip')}</button>
              </div>
            </>
          ) : (
            <>
              <p className="lead">
                {t('reminder.every')}{' '}
                <input
                  className="inline-num"
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  value={cfg.intervalMin}
                  onChange={(e) => onIntervalChange(Number(e.target.value) || cfg.intervalMin)}
                  aria-label={t(`${k}.title`)}
                />{' '}
                {t('reminder.min')}
              </p>
              <p className="muted small">
                {t('reminder.doneToday', { n: r.doneToday })}
                {t(`${k}.note`) !== `${k}.note` && ` · ${t(`${k}.note`)}`}
              </p>
              <div className="actions">
                {onOpen && m.overlay !== 'move' && <button className="btn ghost small" onClick={onOpen}>{t(`${k}.start`)}</button>}
                <button className="btn ghost small" onClick={r.done}>{t('reminder.logNow')}</button>
                <button className="btn ghost small" onClick={r.restart}>{t('reminder.restart')}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
