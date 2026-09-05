import Ring from './Ring'
import { fmtClock } from '../lib/time'

const LABEL = { idle: 'Ready to focus', focus: 'Focus', short: 'Short break', long: 'Long break' }

export default function PomodoroCard({ cfg, p, onChange }) {
  const editing = !p.running && !p.paused
  const field = (key, label, min, max) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={cfg[key]}
        disabled={!editing}
        onChange={(e) => onChange({ [key]: clamp(Number(e.target.value), min, max) })}
      />
    </label>
  )

  return (
    <section className={`card pomodoro phase-${p.phase}`}>
      <header className="card-head">
        <h2>
          <span aria-hidden="true">🍅</span> Pomodoro
        </h2>
        <span className="pill">{LABEL[p.phase]}</span>
      </header>

      <div className="pomo-body">
        <Ring progress={p.progress} size={168} stroke={10} tone={p.phase === 'focus' ? 'coral' : p.phase === 'idle' ? 'teal' : 'green'}>
          <strong className="clock">{fmtClock(p.remainingMs)}</strong>
          <span className="muted small">
            round {(p.round % cfg.roundsBeforeLong) + (p.phase === 'focus' || p.phase === 'idle' ? 1 : 0)}/{cfg.roundsBeforeLong}
          </span>
        </Ring>

        <div className="pomo-controls">
          <div className="actions">
            {p.running ? (
              <button className="btn" onClick={p.pause}>Pause</button>
            ) : p.paused ? (
              <button className="btn primary" onClick={p.resume}>Resume</button>
            ) : (
              <button className="btn primary" onClick={() => p.start('focus')}>Start focus</button>
            )}
            {(p.running || p.paused) && (
              <>
                <button className="btn ghost" onClick={p.skipPhase}>Skip</button>
                <button className="btn ghost" onClick={p.reset}>Reset</button>
              </>
            )}
          </div>

          <div className="fields">
            {field('focusMin', 'Focus', 5, 120)}
            {field('shortBreakMin', 'Short', 1, 30)}
            {field('longBreakMin', 'Long', 5, 60)}
            {field('roundsBeforeLong', 'Rounds', 2, 8)}
          </div>
          <label className="check">
            <input type="checkbox" checked={cfg.autoStartBreaks} onChange={(e) => onChange({ autoStartBreaks: e.target.checked })} />
            Auto-start breaks
          </label>
          {!editing && <p className="muted small">Pause or reset to edit durations.</p>}
          <p className="muted small">{p.completedToday} focus blocks today</p>
        </div>
      </div>
    </section>
  )
}

const clamp = (n, a, b) => (Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : a)
