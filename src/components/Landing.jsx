import StretchFigure from './StretchFigure'

export default function Landing({ auth, onGuest }) {
  return (
    <main className="landing">
      <div className="hero">
        <div className="hero-media" aria-hidden="true">
          {/* Drop a Seedance clip at public/videos/hero.mp4 and it will play here; otherwise the animated scene shows. */}
          <video className="hero-video" src={`${import.meta.env.BASE_URL}videos/hero.mp4`} autoPlay muted loop playsInline preload="none" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="hero-scene">
            <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
            <StretchFigure pose="reach" size={220} className="hero-figure" />
          </div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">DeskFlow</p>
          <h1>Sit less. Sip more. Focus better.</h1>
          <p className="sub">
            Gentle, on-time reminders to stand and stretch every hour, drink water, and work in focused Pomodoro blocks —
            built for people who live on a laptop.
          </p>

          <div className="cta">
            {auth.enabled ? (
              <button className="btn google" onClick={auth.signIn} disabled={auth.loading}>
                <GoogleMark /> Continue with Google
              </button>
            ) : (
              <p className="muted small">Google sign-in appears once Supabase is configured (see README).</p>
            )}
            <button className="btn ghost" onClick={onGuest}>Continue as guest</button>
          </div>
          {auth.error && <p className="error small">{auth.error}</p>}
          <p className="muted small">Guest mode keeps settings on this device. Sign in to sync them across devices — nothing else is stored.</p>
        </div>
      </div>

      <ul className="features">
        <li><strong>Move every 60 min</strong><span>A 3-minute guided routine: reach, neck, hips, eyes, walk.</span></li>
        <li><strong>Hydrate</strong><span>Small sips on a schedule you set, with one-click snooze.</span></li>
        <li><strong>Editable Pomodoro</strong><span>25/5/15 by default — change every number.</span></li>
        <li><strong>Respects your day</strong><span>Quiet hours and weekends off. Never nags twice.</span></li>
      </ul>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}
