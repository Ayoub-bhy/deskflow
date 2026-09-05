import { useEffect, useMemo, useState } from 'react'
import StretchFigure from './StretchFigure'
import { STRETCHES } from '../lib/defaults'
import { fmtClock } from '../lib/time'

/**
 * Guided ~3-minute movement routine shown when a Move reminder is accepted.
 * Steps rotate so users don't see the same 4 stretches every hour.
 * If public/videos/<pose>.mp4 exists it plays (muted, lazy); otherwise the SVG figure.
 */
export default function BreakOverlay({ onDone, onClose, sound }) {
  const steps = useMemo(() => {
    const seed = new Date().getHours()
    const rotated = [...STRETCHES.slice(seed % STRETCHES.length), ...STRETCHES.slice(0, seed % STRETCHES.length)]
    const picked = rotated.filter((s) => s.id !== 'walk').slice(0, 4)
    picked.push(STRETCHES.find((s) => s.id === 'walk'))
    return picked
  }, [])

  const [i, setI] = useState(0)
  const step = steps[i]
  const [endsAt, setEndsAt] = useState(() => Date.now() + step.seconds * 1000)
  const [now, setNow] = useState(Date.now())
  const [videoOk, setVideoOk] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setEndsAt(Date.now() + steps[i].seconds * 1000)
    setVideoOk(true)
  }, [i, steps])

  useEffect(() => {
    if (now >= endsAt) {
      if (i < steps.length - 1) {
        sound?.()
        setI(i + 1)
      } else {
        onDone()
      }
    }
  }, [now, endsAt, i, steps.length, onDone, sound])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const remaining = Math.max(0, endsAt - now)
  const total = step.seconds * 1000

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Movement break">
      <div className="overlay-card">
        <div className="overlay-top">
          <span className="pill">Step {i + 1} of {steps.length}</span>
          <button className="btn ghost small" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="overlay-media">
          {videoOk ? (
            <video
              key={step.pose}
              className="stretch-video"
              src={`/videos/${step.pose}.mp4`}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              onError={() => setVideoOk(false)}
            />
          ) : null}
          {!videoOk && <StretchFigure pose={step.pose} size={200} />}
        </div>

        <h2>{step.title}</h2>
        <p className="cue">{step.cue}</p>

        <div className="stepbar" aria-hidden="true">
          <span style={{ width: `${(1 - remaining / total) * 100}%` }} />
        </div>
        <div className="overlay-actions">
          <strong className="clock small">{fmtClock(remaining)}</strong>
          <button className="btn ghost" onClick={() => (i < steps.length - 1 ? setI(i + 1) : onDone())}>Next</button>
          <button className="btn primary" onClick={onDone}>Done, back to work</button>
        </div>
      </div>
    </div>
  )
}
