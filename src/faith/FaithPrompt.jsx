import Icon from '../components/Icon'
import { useT } from '../i18n'

/** Asked exactly once, in every language, never inferred from locale. */
export default function FaithPrompt({ onAnswer }) {
  const { t } = useT()
  return (
    <section className="card faith-prompt">
      <h2 className="with-icon"><span className="icon-badge badge-gold"><Icon name="prayer" size={18} /></span> {t('faith.promptTitle')}</h2>
      <p className="muted">{t('faith.promptBody')}</p>
      <div className="actions">
        <button className="btn primary" onClick={() => onAnswer(true)}>{t('faith.yes')}</button>
        <button className="btn" onClick={() => onAnswer(false)}>{t('faith.no')}</button>
        <button className="btn ghost" onClick={() => onAnswer('later')}>{t('faith.later')}</button>
      </div>
    </section>
  )
}
