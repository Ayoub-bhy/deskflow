export default function Header({ auth, syncState, onSettings, onLeaveGuest }) {
  const u = auth.user
  return (
    <header className="topbar">
      <div className="brand">
        <img src="/icon.svg" alt="" width="28" height="28" />
        <span>DeskFlow</span>
      </div>
      <div className="topbar-right">
        {u ? (
          <>
            <span className={`sync sync-${syncState}`} title={`Settings ${syncState}`}>
              {syncState === 'synced' ? '● synced' : syncState === 'syncing' ? '○ syncing' : syncState === 'error' ? '! sync error' : ''}
            </span>
            {u.photoURL && <img className="avatar" src={u.photoURL} alt="" referrerPolicy="no-referrer" />}
            <span className="muted small who">{u.displayName?.split(' ')[0] ?? u.email}</span>
            <button className="btn ghost small" onClick={auth.logout}>Sign out</button>
          </>
        ) : (
          <>
            <span className="muted small">Guest</span>
            {auth.enabled && <button className="btn ghost small" onClick={auth.signIn}>Sign in to sync</button>}
            {!auth.enabled && <button className="btn ghost small" onClick={onLeaveGuest}>Home</button>}
          </>
        )}
        <button className="btn ghost small" onClick={onSettings} aria-label="Settings">⚙︎</button>
      </div>
    </header>
  )
}
