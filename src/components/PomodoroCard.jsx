import Ring from './Ring'
import Icon from './Icon'
import { fmtClock } from '../lib/time'
import { useT } from '../i18n'

export default function PomodoroCard({ cfg, p, onChange }) {
  const { t } = useT()
  const editing = !p.running && !p.paused
  const field = (key, label, min, max) => (
    <label className="field">
      <span>{label}</span>
      <input type="number" min={min} max={max} value={cfg[key]} disabled={!editing} onChange={(e) => onChange({ [key]: clamp(Number(e.target.value), min, max) })} />
    </label>
  )

  return (
    <section className={`card pomodoro phase-${p.phase}`}>
      <header className="card-head">
        <h2 className="with-icon">
          <span className="icon-badge badge-coral"><Icon name="focus" size={18} /></span> {t('pomodoro.title')}
        </h2>
        <span className="pill">{t(`pomodoro.${p.phase}`)}</span>
      </header>

      <div className="pomo-body">
        <Ring progress={p.progress} size={168} stroke={10} tone={p.phase === 'focus' ? 'coral' : p.phase === 'idle' ? 'teal' : 'green'}>
          <strong className="clock">{fmtClock(p.remainingMs)}</strong>
          <span className="muted small">
            {t('pomodoro.round', { a: (p.round % cfg.roundsBeforeLong) + (p.phase === 'focus' || p.phase === 'idle' ? 1 : 0), b: cfg.roundsBeforeLong })}
          </span>
        </Ring>

        <div className="pomo-controls">
          <div className="actions">
            {p.running ? (
              <button className="btn with-icon" onClick={p.pause}><Icon name="pause" size={16} /> {t('pomodoro.pause')}</button>
            ) : p.paused ? (
              <button className="btn primary with-icon" onClick={p.resume}><Icon name="play" size={16} /> {t('pomodoro.resume')}</button>
            ) : (
              <button className="btn primary with-icon" onClick={() => p.start('focus')}><Icon name="play" size={16} /> {t('pomodoro.start')}</button>
            )}
            {(p.running || p.paused) && (
              <>
                <button className="btn ghost" onClick={p.skipPhase}>{t('pomodoro.skip')}</button>
                <button className="btn ghost" onClick={p.reset}>{t('pomodoro.reset')}</button>
              </>
            )}
          </div>

          <div className="fields">
            {field('focusMin', t('pomodoro.focusMin'), 5, 120)}
            {field('shortBreakMin', t('pomodoro.shortMin'), 1, 30)}
            {field('longBreakMin', t('pomodoro.longMin'), 5, 60)}
            {field('roundsBeforeLong', t('pomodoro.rounds'), 2, 8)}
          </div>
          <label className="check">
            <input type="checkbox" checked={cfg.autoStartBreaks} onChange={(e) => onChange({ autoStartBreaks: e.target.checked })} />
            {t('pomodoro.autoBreaks')}
          </label>
          {!editing && <p className="muted small">{t('pomodoro.lockNote')}</p>}
          <p className="muted small">{t('pomodoro.doneToday', { n: p.completedToday })}</p>
        </div>
      </div>
    </section>
  )
}

const clamp = (n, a, b) => (Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : a)
