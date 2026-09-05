import { useState } from 'react'
import Icon from '../components/Icon'
import { useT } from '../i18n'
import ayat from './content/ayat.json'
import hadith from './content/hadith'

const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86_400_000)

/** Ayah and hadith of the day: bundled, cited, day-of-year rotation. */
export default function FaithCard({ now, daily }) {
  const { t, lang } = useT()
  const [showTr, setShowTr] = useState(lang !== 'ar')
  const n = dayOfYear(new Date(now))
  const a = ayat[n % ayat.length]
  const h = hadith[n % hadith.length]
  const tr = (o) => (lang === 'fr' ? o.fr : o.en)

  return (
    <section className="card faith-daily">
      <header className="card-head">
        <h2 className="with-icon"><span className="icon-badge badge-gold"><Icon name="book" size={18} /></span> {t('faith.ayah')} · {t('faith.hadith')}</h2>
        {lang !== 'ar' && (
          <button className="btn ghost small" onClick={() => setShowTr((v) => !v)}>{showTr ? t('faith.showAr') : t('faith.showTr')}</button>
        )}
      </header>
      {daily.ayah && (
        <blockquote className="ayah">
          <p className="ar" dir="rtl" lang="ar">{a.ar}</p>
          {lang !== 'ar' && showTr && <p className="tr">{tr(a)}</p>}
          <cite>{lang === 'ar' ? a.surah.ar : a.surah.en} {a.surah.n}:{a.ayah}</cite>
        </blockquote>
      )}
      {daily.hadith && (
        <blockquote className="hadith">
          <p className="ar" dir="rtl" lang="ar">{h.ar}</p>
          {lang !== 'ar' && showTr && <p className="tr">{tr(h)}</p>}
          <cite>{t('faith.ref')}: {h.ref}</cite>
        </blockquote>
      )}
    </section>
  )
}
