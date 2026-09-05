import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { useT } from '../i18n'
import dhikr from './content/dhikr'

/** Weighted pick, salawat boosted on Fridays; rotates by hour so it isn't the same phrase all day. */
export function pickDhikr(now = Date.now()) {
  const d = new Date(now)
  const friday = d.getDay() === 5
  const pool = dhikr.flatMap((x) => Array((x.weight || 1) * (friday && x.friday ? 3 : 1)).fill(x))
  return pool[(d.getHours() * 7 + d.getDate()) % pool.length]
}

export default function DhikrOverlay({ onDone, onClose, sound }) {
  const { t, lang } = useT()
  const item = useMemo(() => pickDhikr(), [])
  const [count, setCount] = useState(0)
  const target = item.count
  const tap = () => {
    setCount((c) => {
      const n = c + 1
      if (n === target) sound?.()
      return n
    })
  }
  return (
    <div className="overlay dhikr" role="dialog" aria-modal="true" aria-label={t('faith.dhikrTitle')}>
      <div className="overlay-card">
        <div className="overlay-top">
          <span className="pill gold">{t('faith.dhikrTitle')}</span>
          <button className="btn ghost small" onClick={onClose} aria-label={t('routine.close')}><Icon name="close" size={16} /></button>
        </div>
        <button className={`tasbih ${count >= target ? 'complete' : ''}`} onClick={tap} aria-label={t('faith.dhikrTap')}>
          <span className="tasbih-count">{count}</span>
          <span className="tasbih-target">/ {target}</span>
        </button>
        <p className="ar big" dir="rtl" lang="ar">{item.ar}</p>
        <p className="tr-line">{item.tr}</p>
        <p className="cue">{lang === 'fr' ? item.fr : item.en}</p>
        <p className="muted small">{t('faith.dhikrIntro')} · {item.ref}</p>
        <div className="overlay-actions">
          <button className="btn ghost small" onClick={() => setCount(0)}>{t('faith.dhikrReset')}</button>
          <button className="btn primary" onClick={onDone}>{t('faith.dhikrDone')}</button>
        </div>
      </div>
    </div>
  )
}
