import Ring from './Ring'
import Icon from './Icon'
import { KINDS as ALL_KINDS, GOALS } from '../reminders/registry'
import { useT } from '../i18n'


export default function ProgressBoard({ today, week, streak, onHistory, kinds = ALL_KINDS }) {
  const { t } = useT()
  const SERIES = kinds.map((k) => ({ key: k.id, icon: k.icon, color: k.color }))
  const KIND_IDS = kinds.map((k) => k.id)
  const label = Object.fromEntries(KIND_IDS.map((k) => [k, t(`kinds.${k}`)]))
  const score = Math.round((KIND_IDS.reduce((acc, k) => acc + Math.min(1, today[k] / GOALS[k]), 0) / KIND_IDS.length) * 100)

  return (
    <section className="card board">
      <header className="card-head">
        <h2 className="with-icon">
          <span className="icon-badge badge-teal"><Icon name="progress" size={18} /></span> {t('board.title')}
        </h2>
        <span className="pill with-icon" title={t('board.streakHelp')}>
          <Icon name="streak" size={14} /> {t('board.streak', { n: streak })}
        </span>
      </header>

      <div className="board-top">
        <Ring progress={score / 100} size={132} stroke={10} tone={score >= 80 ? 'green' : 'teal'}>
          <strong>{score}%</strong>
          <span className="muted small">{t('board.score')}</span>
        </Ring>

        <ul className="goals">
          {SERIES.map((s) => {
            const v = today[s.key]
            const g = GOALS[s.key]
            return (
              <li key={s.key}>
                <div className="goal-row">
                  <span className="with-icon" style={{ color: s.color }}>
                    <Icon name={s.icon} size={16} /> <span style={{ color: 'var(--ink)' }}>{label[s.key]}</span>
                  </span>
                  <strong>{v}<span className="muted">/{g}</span></strong>
                </div>
                <div className="bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (v / g) * 100)}%`, background: s.color }} /></div>
              </li>
            )
          })}
        </ul>
      </div>

      <WeekChart week={week} days={t('board.days')} label={label} moveGoal={t('board.moveGoal')} series={SERIES} />
      <div className="board-foot">
        <p className="muted small">{t('board.goalsPrefix')} {SERIES.map((s) => `${GOALS[s.key]} ${label[s.key].toLowerCase()}`).join(' · ')}</p>
        <button className="btn ghost small with-icon" onClick={onHistory}><Icon name="progress" size={14} /> {t('header.history')}</button>
      </div>
    </section>
  )
}

function WeekChart({ week, days, label, moveGoal, series: SERIES }) {
  const W = 420, H = 110, pad = 8
  const groupW = (W - pad * 2) / 7
  const n = SERIES.length
  const barW = groupW / (n + 1.5)
  const max = Math.max(GOALS.move, ...week.flatMap((d) => SERIES.map((s) => d[s.key] || 0)))
  const goalY = H - (GOALS.move / max) * (H - 10)
  return (
    <div className="weekchart">
      <svg viewBox={`0 0 ${W} ${H + 22}`} role="img">
        <line x1={pad} x2={W - pad} y1={goalY} y2={goalY} className="goal-line" />
        {week.map((d, i) => {
          const x0 = pad + i * groupW + (groupW - barW * n - 3 * (n - 1)) / 2
          return (
            <g key={d.key} className={d.isToday ? 'today' : ''}>
              {SERIES.map((s, j) => {
                const h = ((d[s.key] || 0) / max) * (H - 10)
                return <rect key={s.key} x={x0 + j * (barW + 3)} y={H - h} width={barW} height={h} rx="3" fill={s.color} opacity={d.isToday ? 1 : 0.55}><title>{`${days[d.dow]}: ${d[s.key] || 0} ${label[s.key]}`}</title></rect>
              })}
              <text x={pad + i * groupW + groupW / 2} y={H + 16} textAnchor="middle" className="axis">{days[d.dow]}</text>
            </g>
          )
        })}
      </svg>
      <div className="legend small muted">
        {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} /> {label[s.key]}</span>)}
        <span><i className="dash" /> {moveGoal}</span>
      </div>
    </div>
  )
}
