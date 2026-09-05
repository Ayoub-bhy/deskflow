export const SETTINGS_VERSION = 1

export const DEFAULT_SETTINGS = {
  version: SETTINGS_VERSION,
  move: { enabled: true, intervalMin: 60, snoozeMin: 5 },
  water: { enabled: true, intervalMin: 45, snoozeMin: 10 },
  pomodoro: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, roundsBeforeLong: 4, autoStartBreaks: true },
  quietHours: { enabled: true, start: '18:00', end: '08:30', weekdaysOnly: true },
  alerts: { sound: true, notifications: false, volume: 0.6 },
}

export const STRETCHES = [
  { id: 'stand', title: 'Stand up & reach', seconds: 30, cue: 'Stand, inhale, reach both arms overhead. Lengthen through the spine.', pose: 'reach' },
  { id: 'neck', title: 'Neck release', seconds: 30, cue: 'Tilt right ear to right shoulder, 15s each side. Keep shoulders down.', pose: 'neck' },
  { id: 'shoulders', title: 'Shoulder rolls', seconds: 20, cue: '10 slow rolls backwards. Open the chest — undo the laptop hunch.', pose: 'shoulders' },
  { id: 'hips', title: 'Hip flexor stretch', seconds: 40, cue: 'Half-kneel or lunge, tuck the pelvis, 20s each side. Hips get tight from sitting.', pose: 'lunge' },
  { id: 'hamstring', title: 'Forward fold', seconds: 30, cue: 'Soft knees, fold forward, let the head hang. Breathe.', pose: 'fold' },
  { id: 'eyes', title: '20-20-20 eyes', seconds: 20, cue: 'Look at something 20 feet (6 m) away for 20 seconds.', pose: 'eyes' },
  { id: 'wrists', title: 'Wrist & forearm', seconds: 30, cue: 'Arm out, palm up, gently pull fingers back. 15s each side.', pose: 'wrist' },
  { id: 'walk', title: 'Short walk', seconds: 60, cue: 'Walk to the window or refill your water. Movement beats any single stretch.', pose: 'walk' },
]

// Best-practice tips shown on the dashboard (rotates).
export const TIPS = [
  'Screen top at eye level: stack the laptop on books and use an external keyboard.',
  'Elbows ~90°, wrists straight, shoulders relaxed. If you shrug to type, raise the chair or lower the desk.',
  'The best posture is the next posture — change position often rather than holding one “perfect” one.',
  'Feet flat on the floor or on a footrest; avoid dangling legs.',
  'Aim for roughly 30–35 ml of water per kg of body weight per day; sip, don’t chug.',
  'Every 20 min, look 20 ft away for 20 s to relax the eye muscles.',
  'Stand or walk for 5 min every hour — it matters more than a 60-min gym session for metabolic health.',
  'Brightness ≈ ambient room light; reduce glare by placing the screen perpendicular to windows.',
]
