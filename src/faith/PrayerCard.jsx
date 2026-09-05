import { useState } from 'react'
import Icon from '../components/Icon'
import { useT } from '../i18n'
import { PRAYERS, METHODS, prayersOn, dayKey, fmtHM } from './prayer'
import { fmtRelative } from '../lib/time'
import { requestLocation } from './usePrayer'

export default function PrayerCard({ prayer, cfg, now, onChange, onHide }) {
  const { t, lang } = useT()
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [denied, setDenied] = useState(false)
  const P = t('faith.prayers')
  const method = METHODS.find((m) => m.id === cfg.method)?.name ?? `#${cfg.method}`
  const today = prayer.days ? prayersOn(prayer.days, dayKey(now), cfg.offsets) : []
  const isFriday = new Date(now).getDay() === 5

  const useGps = async () => {
    const loc = await requestLocation()
    if (loc) onChange({ location: loc })
    else setDenied(true)
  }
  const setCityLoc = () => city.trim() && country.trim() && onChange({ location: { city: city.trim(), country: country.trim(), label: `${city.trim()}, ${country.trim()}` } })

  return (
    <section className={`card prayer ${prayer.window ? 'is-due' : ''}`}>
      <header className="card-head">
        <h2 className="with-icon"><span className="icon-badge badge-gold"><Icon name="prayer" size={18} /></span> {t('faith.prayerTitle')}</h2>
        <div className="with-icon">
          {prayer.today && <span className="pill gold">{t('faith.hijri', { d: prayer.today.hijri.day, m: lang === 'ar' ? prayer.today.hijri.monthAr : prayer.today.hijri.month, y: prayer.today.hijri.year })}</span>}
          <button className="btn ghost small" onClick={onHide} title={t('faith.hideSession')} aria-label={t('faith.hideSession')}><Icon name="eyeoff" size={16} /></button>
        </div>
      </header>

      {!cfg.location ? (
        <div className="prayer-setup">
          <p className="muted">{t('faith.locationNone')}</p>
          <div className="actions">
            <button className="btn primary" onClick={useGps}>{t('faith.useGps')}</button>
          </div>
          {denied && <p className="small error">{t('faith.locationDenied')}</p>}
          <p className="muted small">{t('faith.orCity')}</p>
          <div className="fields">
            <label className="field"><span>{t('faith.city')}</span><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Riyadh" /></label>
            <label className="field"><span>{t('faith.country')}</span><input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="SA" /></label>
          </div>
          <button className="btn small" onClick={setCityLoc}>{t('faith.setCity')}</button>
        </div>
      ) : (
        <>
          {prayer.window ? (
            <p className="lead gold-text">{t('faith.breakActive', { p: prayer.window.isJumuah ? t('faith.jumuah') : P[prayer.window.name] })}</p>
          ) : prayer.next ? (
            <p className="lead">
              {t('faith.next')}: <strong>{prayer.next.isJumuah ? t('faith.jumuah') : P[prayer.next.name]}</strong> · {fmtHM(prayer.next.at, lang)} <span className="muted">({t('faith.in', { t: fmtRelative(prayer.next.at - now, t) })})</span>
            </p>
          ) : (
            <p className="muted">{prayer.status === 'loading' ? t('faith.loading') : t('faith.missing')}</p>
          )}

          {today.length > 0 && (
            <ul className="prayer-list">
              {today.map((p) => {
                const passed = p.at <= now
                const isNext = prayer.next?.name === p.name && dayKey(prayer.next.at) === dayKey(now)
                return (
                  <li key={p.name} className={`${passed ? 'passed' : ''} ${isNext ? 'next' : ''}`}>
                    <span>{p.isJumuah ? t('faith.jumuah') : P[p.name]}</span>
                    <b>{fmtHM(p.at, lang)}</b>
                  </li>
                )
              })}
            </ul>
          )}

          {prayer.sunnah && <p className="small gold-text">{t(`faith.${prayer.sunnah}`)}</p>}
          {isFriday && <p className="small muted">{t('faith.fridayNote')}</p>}
          {!prayer.fresh.ok && prayer.days && <p className="small warn with-icon"><Icon name="alert" size={14} /> {t('faith.stale')}</p>}
          {prayer.status === 'error' && <p className="small warn">{t('faith.error')}</p>}
          {prayer.fresh.reason === 'tz' && <p className="small warn">{t('faith.tzWarn', { a: Intl.DateTimeFormat().resolvedOptions().timeZone, b: prayer.fresh.tz })}</p>}
          <p className="muted small">{t('faith.source', { m: method })} · {cfg.school === 1 ? t('faith.schoolHanafi') : t('faith.schoolStd')} · {cfg.location.label}</p>
        </>
      )}
    </section>
  )
}

export { PRAYERS }
