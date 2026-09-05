import Icon from './Icon'
import { useT } from '../i18n'
import { inQuietHours } from '../lib/time'

/**
 * Context-aware advice:
 *  - working day, inside working hours  → desk tip (posture, water, eyes)
 *  - working day, after hours           → post-work recovery advice
 *  - non-working day                    → weekend / day-off advice
 * One line, rotating hourly, so it never feels like a feed.
 */
export default function AdviceCard({ quietHours, now, faith = false }) {
  const { t } = useT()
  const d = new Date(now)
  const workDays = quietHours.workDays ?? [1, 2, 3, 4, 5]
  const isWorkDay = workDays.includes(d.getDay())
  const offHours = quietHours.enabled && inQuietHours(quietHours, d)
  const mode = !isWorkDay ? 'weekend' : offHours ? 'postwork' : 'tip'
  const base = mode === 'weekend' ? t('adviceWeekend') : mode === 'postwork' ? t('advicePostwork') : t('tips')
  const extra = faith && mode === 'weekend' ? t('adviceWeekendFaith') : faith && mode === 'postwork' ? t('advicePostworkFaith') : []
  const list = [...base, ...extra]
  const text = list[Math.floor(now / 3_600_000) % list.length]

  return (
    <section className={`card tip advice-${mode}`}>
      <h2 className="with-icon">
        <span className={`icon-badge ${mode === 'tip' ? 'badge-amber' : 'badge-violet'}`}><Icon name={mode === 'tip' ? 'tip' : mode === 'weekend' ? 'sun' : 'moon'} size={18} /></span>
        {mode === 'tip' ? t('tip.title') : t('advice.title')}
        {mode !== 'tip' && <span className="pill">{t(`advice.${mode}`)}</span>}
      </h2>
      <p>{text}</p>
    </section>
  )
}
