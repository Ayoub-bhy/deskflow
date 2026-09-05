import Ring from './Ring'
import { fmtRelative } from '../lib/time'

const META = {
  move: { title: 'Move', emoji: '🧍', verb: 'Stand & stretch', tone: 'teal', doneLabel: 'I moved' },
  water: { title: 'Hydrate', emoji: '💧', verb: 'Drink water', tone: 'blue', doneLabel: 'I drank' },
}

export default function ReminderCard({ kind, cfg, r, onToggle, onIntervalChange, onOpenBreak }) {
  const m = META[kind]
  return (
    <section className={`card reminder ${r.due ? 'is-due' : ''} ${!cfg.enabled ? 'is-off' : ''}`} aria-live="polite">
      <header className="card-head">
        <h2>
          <span aria-hidden="true">{m.emoji}</span> {m.title}
        </h2>
        <label className="switch" title={cfg.enabled ? 'Turn off' : 'Turn on'}>
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span />
        </label>
      </header>

      <div className="reminder-body">
        <Ring progress={cfg.enabled ? r.progress : 0} tone={m.tone} size={124}>
          {!cfg.enabled ? (
            <span className="muted small">off</span>
          ) : r.due ? (
            <strong className="due-label">now</strong>
          ) : (
            <>
              <strong>{fmtRelative(r.remainingMs)}</strong>
              <span className="muted small">until next</span>
            </>
          )}
        </Ring>

        <div className="reminder-info">
          {r.due ? (
            <>
              <p className="lead">
                {m.verb}
                {r.overdueMs > 90_000 && <span className="muted"> · due {fmtRelative(r.overdueMs)} ago</span>}
              </p>
              <div className="actions">
                {kind === 'move' ? (
                  <button className="btn primary" onClick={onOpenBreak}>Start 3-min routine</button>
                ) : null}
                <button className="btn" onClick={r.done}>{m.doneLabel}</button>
                <button className="btn ghost" onClick={() => r.snooze()}>Snooze {cfg.snoozeMin}m</button>
                <button className="btn ghost" onClick={r.skip}>Skip</button>
              </div>
            </>
          ) : (
            <>
              <p className="lead">
                Every{' '}
                <input
                  className="inline-num"
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  value={cfg.intervalMin}
                  onChange={(e) => onIntervalChange(Number(e.target.value) || cfg.intervalMin)}
                  aria-label={`${m.title} interval in minutes`}
                />{' '}
                min
              </p>
              <p className="muted small">
                {r.doneToday} done today
                {kind === 'move' && ' · standing 5 min per hour counts'}
              </p>
              <div className="actions">
                <button className="btn ghost small" onClick={r.done}>Log one now</button>
                <button className="btn ghost small" onClick={r.restart}>Restart timer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
