import Icon from './Icon'
import { useT, LANGS } from '../i18n'

export default function Header({ auth, syncState, lang, onLang, onSettings, onHistory, onLeaveGuest }) {
  const { t } = useT()
  const u = auth.user
  return (
    <header className="topbar">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="28" height="28" />
        <span>{t('app.name')}</span>
      </div>
      <div className="topbar-right">
        {u ? (
          <>
            <span className={`sync sync-${syncState}`}>{syncState === 'synced' ? t('header.synced') : syncState === 'syncing' ? t('header.syncing') : syncState === 'error' ? t('header.syncError') : ''}</span>
            {u.photoURL && <img className="avatar" src={u.photoURL} alt="" referrerPolicy="no-referrer" />}
            <span className="muted small who">{u.displayName?.split(' ')[0] ?? u.email}</span>
            <button className="btn ghost small" onClick={auth.logout}>{t('header.signOut')}</button>
          </>
        ) : (
          <>
            <span className="muted small">{t('header.guest')}</span>
            {auth.enabled ? <button className="btn ghost small" onClick={auth.signIn}>{t('header.signIn')}</button> : <button className="btn ghost small" onClick={onLeaveGuest}>{t('header.home')}</button>}
          </>
        )}
        <select className="lang" value={lang} onChange={(e) => onLang(e.target.value)} aria-label={t('header.language')}>
          {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.meta.name}</option>)}
        </select>
        <button className="btn ghost small" onClick={onHistory} aria-label={t('header.history')} title={t('header.history')}><Icon name="progress" size={18} /></button>
        <button className="btn ghost small" onClick={onSettings} aria-label={t('header.settings')} title={t('header.settings')}><Icon name="settings" size={18} /></button>
      </div>
    </header>
  )
}
