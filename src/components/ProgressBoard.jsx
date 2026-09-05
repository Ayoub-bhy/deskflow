import Ring from './Ring'
import { GOALS } from '../hooks/useHistory'

const SERIES = [
  { key: 'move', label: 'Moves', emoji: '🧍', tone: 'teal', color: 'var(--teal)' },
  { key: 'water', label: 'Water', emoji: '💧', tone: 'blue', color: 'var(--blue)' },
  { key: 'focus', label: 'Focus blocks', emoji: '🍅', tone: 'coral', color: 'var(--coral)' },
]

export default function ProgressBoard({ today, week, streak }) {
  const score = Math.round(
    (SERIES.reduce((acc, s) => acc + Math.min(1, today[s.key] / GOALS[s.key]), 0) / SERIES.length) * 100,
  )

  return (
    <section className="card board">
      <header className="card-head">
        <h2>
          <span aria-hidden="true">📊</span> Today’s progress
        </h2>
        <span className="pill" title="Consecutive days with at least half the move goal">
          🔥 {streak}-day streak
        </span>
      </header>

      <div className="board-top">
        <div className="score">
          <Ring progress={score / 100} size={132} stroke={10} tone={score >= 80 ? 'green' : 'teal'}>
            <strong>{score}%</strong>
            <span className="muted small">desk score</span>
          </Ring>
        </div>

        <ul className="goals">
          {SERIES.map((s) => {
            const v = today[s.key]
            const g = GOALS[s.key]
            const pct = Math.min(100, (v / g) * 100)
            return (
              <li key={s.key}>
                <div className="goal-row">
                  <span>
                    <span aria-hidden="true">{s.emoji}</span> {s.label}
                  </span>
                  <strong>
                    {v}
                    <span className="muted">/{g}</span>
                  </strong>
                </div>
                <div className="bar" aria-hidden="true">
                  <span style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <WeekChart week={week} />
      <p className="muted small board-foot">
        Goals: {GOALS.move} moves, {GOALS.water} glasses, {GOALS.focus} focus blocks per working day. Log moves with “I moved” or the routine; water with “I drank”.
      </p>
    </section>
  )
}

function WeekChart({ week }) {
  const W = 420
  const H = 120
  const pad = 8
  const groupW = (W - pad * 2) / 7
  const barW = groupW / 4.5
  const max = Math.max(GOALS.move, ...week.flatMap((d) => [d.move, d.water, d.focus]))

  return (
    <div className="weekchart">
      <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label="Last 7 days of moves, water and focus blocks">
        {/* goal line for moves */}
        <line x1={pad} x2={W - pad} y1={H - (GOALS.move / max) * (H - 10)} y2={H - (GOALS.move / max) * (H - 10)} className="goal-line" />
        {week.map((d, i) => {
          const x0 = pad + i * groupW + (groupW - barW * 3 - 6) / 2
          return (
            <g key={d.key} className={d.isToday ? 'today' : ''}>
              {SERIES.map((s, j) => {
                const h = (d[s.key] / max) * (H - 10)
                return (
                  <rect key={s.key} x={x0 + j * (barW + 3)} y={H - h} width={barW} height={h} rx="3" fill={s.color} opacity={d.isToday ? 1 : 0.55}>
                    <title>{`${d.label}: ${d[s.key]} ${s.label.toLowerCase()}`}</title>
                  </rect>
                )
              })}
              <text x={pad + i * groupW + groupW / 2} y={H + 16} textAnchor="middle" className="axis">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="legend small muted">
        {SERIES.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} /> {s.label}
          </span>
        ))}
        <span>
          <i className="dash" /> move goal
        </span>
      </div>
    </div>
  )
}
