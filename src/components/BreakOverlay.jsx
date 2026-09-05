import { useMemo, useState } from 'react'
import { useStepTimer } from '../hooks/useStepTimer'
import StretchFigure from './StretchFigure'
import Icon from './Icon'
import { STRETCHES } from '../lib/defaults'
import { fmtClock } from '../lib/time'
import { useT } from '../i18n'

/** Guided ~3-minute movement routine; steps rotate hourly. Videos in public/videos/<pose>.mp4 override the figure. */
export default function BreakOverlay({ onDone, onClose, sound }) {
  const { t } = useT()
  const steps = useMemo(() => {
    const seed = new Date().getHours()
    const rotated = [...STRETCHES.slice(seed % STRETCHES.length), ...STRETCHES.slice(0, seed % STRETCHES.length)]
    return [...rotated.filter((s) => s.id !== 'walk').slice(0, 5), STRETCHES.find((s) => s.id === 'walk')]
  }, [])

  const { i, step, remaining, total, next } = useStepTimer(steps, { onStep: sound, onFinish: onDone, onClose })
  const [videoFailed, setVideoFailed] = useState({})
  const videoOk = !videoFailed[step.pose]
  const [title, cue] = t(`stretches.${step.id}`)

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('reminder.move.title')}>
      <div className="overlay-card">
        <div className="overlay-top">
          <span className="pill">{t('routine.step', { a: i + 1, b: steps.length })}</span>
          <button className="btn ghost small" onClick={onClose} aria-label={t('routine.close')}><Icon name="close" size={16} /></button>
        </div>
        <div className="overlay-media">
          {videoOk && <video key={step.pose} className="stretch-video" src={`${import.meta.env.BASE_URL}videos/${step.pose}.mp4`} autoPlay muted loop playsInline preload="none" onError={() => setVideoFailed((f) => ({ ...f, [step.pose]: true }))} />}
          {!videoOk && <StretchFigure pose={step.pose} size={200} />}
        </div>
        <h2>{title}</h2>
        <p className="cue">{cue}</p>
        <div className="stepbar" aria-hidden="true"><span style={{ width: `${(1 - remaining / total) * 100}%` }} /></div>
        <div className="overlay-actions">
          <strong className="clock small">{fmtClock(remaining)}</strong>
          <button className="btn ghost" onClick={next}>{t('routine.next')}</button>
          <button className="btn primary" onClick={onDone}>{t('routine.done')}</button>
        </div>
      </div>
    </div>
  )
}
