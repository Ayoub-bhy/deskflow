import { useMemo } from 'react'
import { useStepTimer } from '../hooks/useStepTimer'
import StretchFigure from './StretchFigure'
import Icon from './Icon'
import { MIND } from '../lib/defaults'
import { fmtClock } from '../lib/time'
import { useT } from '../i18n'

/**
 * Two-minute mind reset: three exercises picked from MIND, rotating by hour so
 * they don't repeat. Always starts with a breathing exercise (the fastest lever),
 * then a gaze or stillness exercise, then one more.
 * Deliberately no images, no scrolling, big type, one thing on screen.
 */
export default function MindOverlay({ onDone, onClose, sound, faith = false }) {
  const { t } = useT()
  const steps = useMemo(() => {
    const h = new Date().getHours()
    const pool = MIND.filter((m) => faith || !m.faith)
    const breath = pool.filter((m) => m.kind === 'breath')
    const rest = pool.filter((m) => m.kind !== 'breath')
    const pick = (arr, n, seed) => Array.from({ length: n }, (_, i) => arr[(seed + i * 3) % arr.length])
    return [breath[h % breath.length], ...pick(rest, 2, h)]
  }, [faith])

  const { i, step, remaining, elapsed, next } = useStepTimer(steps, { onStep: sound, onFinish: onDone, onClose, tickMs: 100 })
  const [title, cue] = step.faith ? t(`mindFaith.${step.id}`) : t(`mind.${step.id}`)

  return (
    <div className="overlay mind" role="dialog" aria-modal="true" aria-label={t('reminder.mind.title')}>
      <div className="overlay-card">
        <div className="overlay-top">
          <span className="pill">{t('mindOverlay.step', { a: i + 1, b: steps.length })}</span>
          <button className="btn ghost small" onClick={onClose} aria-label={t('routine.close')}><Icon name="close" size={16} /></button>
        </div>

        <div className="overlay-media mind-media">
          {step.kind === 'breath' ? <Breath pattern={step.pattern} elapsed={elapsed} /> : step.kind === 'sense' ? <Sense elapsed={elapsed} total={step.seconds * 1000} /> : <StretchFigure pose={step.pose} size={200} className="calm" />}
        </div>

        <h2>{title}</h2>
        <p className="cue">{cue}</p>
        {i === 0 && <p className="muted small">{t('mind.intro')}</p>}

        <div className="stepbar" aria-hidden="true"><span style={{ width: `${(1 - remaining / (step.seconds * 1000)) * 100}%` }} /></div>
        <div className="overlay-actions">
          <strong className="clock small">{fmtClock(remaining)}</strong>
          <button className="btn ghost" onClick={next}>{t('mindOverlay.next')}</button>
          <button className="btn primary" onClick={onDone}>{t('mindOverlay.done')}</button>
        </div>
      </div>
    </div>
  )
}

/** Circle grows on inhale, holds, shrinks on exhale; phase label underneath. */
function Breath({ pattern, elapsed }) {
  const { t } = useT()
  const cycle = pattern.reduce((s, [, d]) => s + d, 0) * 1000
  let tIn = elapsed % cycle
  let phase = pattern[0]
  let phaseStart = 0
  for (const p of pattern) {
    if (tIn < p[1] * 1000) { phase = p; break }
    tIn -= p[1] * 1000
    phaseStart += p[1] * 1000
  }
  const frac = tIn / (phase[1] * 1000)
  // scale: inhale 0.55→1, exhale 1→0.55, hold keeps the previous end value
  const prevIdx = (pattern.indexOf(phase) - 1 + pattern.length) % pattern.length
  const prev = pattern[prevIdx][0]
  const scale = phase[0] === 'inhale' ? 0.55 + 0.45 * frac : phase[0] === 'exhale' ? 1 - 0.45 * frac : prev === 'inhale' ? 1 : 0.55
  return (
    <div className="breath">
      <div className="breath-ring" />
      <div className="breath-ball" style={{ transform: `scale(${scale})` }} />
      <div className="breath-label">
        <strong>{t(`mindOverlay.${phase[0]}`)}</strong>
        <span className="muted small">{Math.ceil(phase[1] - tIn / 1000)}</span>
      </div>
    </div>
  )
}

/** 5-4-3-2-1 grounding: counts down through the senses over the step. */
function Sense({ elapsed, total }) {
  const stages = [5, 4, 3, 2, 1]
  const idx = Math.min(stages.length - 1, Math.floor((elapsed / total) * stages.length))
  return (
    <div className="sense">
      {stages.map((n, k) => (
        <span key={n} className={`sense-n ${k === idx ? 'on' : k < idx ? 'done' : ''}`}>{n}</span>
      ))}
    </div>
  )
}
