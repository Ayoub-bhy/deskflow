import { useState } from 'react'
import Icon from './Icon'
import { useT } from '../i18n'
import { KINDS as REG, GOALS } from '../reminders/registry'

const COLOR = Object.fromEntries(REG.map((k) => [k.id, k.color]))
const ICON = Object.fromEntries(REG.map((k) => [k.id, k.icon]))

export default function HistoryView({ stats, onBack, onExport, kinds = REG }) {
  const { t, lang } = useT()
  const KINDS = kinds.map((k) => k.id)
  const [kind, setKind] = useState('move')
  const fmtDate = (k) => new Date(k + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtMonth = (k) => new Date(k + '-15T12:00:00').toLocaleDateString(lang, { month: 'long', year: 'numeric' })
  const label = Object.fromEntries(KINDS.map((k) => [k, t(`kinds.${k}`)]))

  return (
    <main className="history">
      <div className="hist-head">
        <button className="btn ghost small with-icon" onClick={onBack}><Icon name="home" size={16} /> {t('history.back')}</button>
        <h1 className="with-icon"><Icon name="progress" size={22} /> {t('history.title')}</h1>
        {stats.startedAt && <span className="muted small">{t('history.since', { d: fmtDate(stats.startedAt) })}</span>}
        <button className="btn small with-icon" onClick={onExport}><Icon name="install" size={16} /> {t('history.export')}</button>
      </div>

      {!stats.startedAt ? (
        <section className="card"><p className="muted">{t('history.empty')}</p></section>
      ) : (
        <>
          <section className="stat-grid">
            {KINDS.map((k) => (
              <button key={k} className={`card stat ${kind === k ? 'is-active' : ''}`} onClick={() => setKind(k)} style={{ '--c': COLOR[k] }}>
                <span className="with-icon stat-label"><Icon name={ICON[k]} size={16} /> {label[k]}</span>
                <strong>{stats.totals[k]}</strong>
                <span className="muted small">{t('history.total')}</span>
                <div className="stat-sub">
                  <span><b>{stats.best[k]}</b> {t('history.best')}</span>
                  <span><b>{stats.activeDays ? (stats.totals[k] / stats.activeDays).toFixed(1) : 0}</b> {t('history.avg')}</span>
                </div>
              </button>
            ))}
            <div className="card stat">
              <span className="stat-label">{t('history.activeDays')}</span>
              <strong>{stats.activeDays}</strong>
            </div>
          </section>

          {stats.months.map((m) => (
            <section key={m.key} className="card month">
              <header className="card-head">
                <h2>{fmtMonth(m.key)}</h2>
                <div className="month-totals small">
                  {KINDS.map((k) => (
                    <span key={k} className="with-icon" style={{ color: COLOR[k] }}><Icon name={ICON[k]} size={14} /> <b style={{ color: 'var(--ink)' }}>{m.totals[k]}</b></span>
                  ))}
                </div>
              </header>
              <Heatmap month={m} kind={kind} lang={lang} />
            </section>
          ))}
          <p className="muted small legend">
            {t('history.less')} <i className="cell l0" /><i className="cell l1" /><i className="cell l2" /><i className="cell l3" /><i className="cell l4" /> {t('history.more')} · {label[kind]}
          </p>
        </>
      )}
    </main>
  )
}

function Heatmap({ month, kind, lang }) {
  const [y, mo] = month.key.split('-').map(Number)
  const first = new Date(y, mo - 1, 1)
  const daysIn = new Date(y, mo, 0).getDate()
  const lead = first.getDay()
  const goal = GOALS[kind]
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(<i key={'p' + i} className="cell pad" />)
  for (let d = 1; d <= daysIn; d++) {
    const key = `${month.key}-${String(d).padStart(2, '0')}`
    const v = month.days[key]?.[kind] || 0
    const lvl = v === 0 ? 0 : v < goal * 0.34 ? 1 : v < goal * 0.67 ? 2 : v < goal ? 3 : 4
    const title = `${new Date(key + 'T12:00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })}: ${v}`
    cells.push(<i key={key} className={`cell l${lvl}`} title={title} style={{ '--c': COLOR[kind] }} />)
  }
  return <div className="heat" style={{ '--c': COLOR[kind] }}>{cells}</div>
}
