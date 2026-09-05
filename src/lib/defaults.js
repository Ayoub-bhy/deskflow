import { REMINDER_DEFAULTS } from '../reminders/registry'

/** Bump when the settings shape changes and add a case to migrateSettings. */
export const SETTINGS_VERSION = 2

export const DEFAULT_SETTINGS = {
  lang: null, // null → detect from browser
  ...REMINDER_DEFAULTS, // move / water / mind: { enabled, intervalMin, snoozeMin }
  pomodoro: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, roundsBeforeLong: 4, autoStartBreaks: true },
  quietHours: { enabled: true, start: '18:00', end: '08:30', workDays: [1, 2, 3, 4, 5] }, // 0=Sun … 6=Sat
  alerts: { sound: true, notifications: false, volume: 0.6 },
  // Faith layer. `enabled: null` = not asked yet (prompt once, in every language, never inferred from locale).
  faith: {
    enabled: null,
    sound: false, // separate from the feature: shared offices
    discreet: false, // banners read "Reminder" to onlookers; content on hover/click
    prayer: {
      method: 4, // Umm Al-Qura (Aladhan method id)
      school: 0, // 0 = Shafi'i/Maliki/Hanbali Asr, 1 = Hanafi
      latAdj: 3, // high-latitude rule: 1 middle of night, 2 one-seventh, 3 angle based
      location: null, // { lat, lon, label } or { city, country, label }
      offsets: { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
      headsUpMin: 10,
      pauseMin: 20,
      pauseOthers: true,
    },
    daily: { ayah: true, hadith: true },
  },
}

/** localStorage migrations for `settings`. v0 = unversioned legacy, v1 = weekdaysOnly flag, v2 = workDays array. */
export function migrateSettings(v, data) {
  const d = { ...(data || {}) }
  if (v <= 1 && d.quietHours && !Array.isArray(d.quietHours.workDays)) {
    const { weekdaysOnly, ...rest } = d.quietHours
    d.quietHours = { ...rest, workDays: weekdaysOnly === false ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5] }
  }
  delete d.version
  return d
}

// Text lives in i18n/*.js under `stretches.<id>`; this is structure only.
export const STRETCHES = [
  { id: 'stand', seconds: 30, pose: 'reach' },
  { id: 'handsup', seconds: 30, pose: 'handsup' },
  { id: 'squat', seconds: 40, pose: 'squat' },
  { id: 'sidebend', seconds: 30, pose: 'sidebend' },
  { id: 'march', seconds: 40, pose: 'march' },
  { id: 'calf', seconds: 30, pose: 'calf' },
  { id: 'neck', seconds: 30, pose: 'neck' },
  { id: 'shoulders', seconds: 20, pose: 'shoulders' },
  { id: 'hips', seconds: 40, pose: 'lunge' },
  { id: 'hamstring', seconds: 30, pose: 'fold' },
  { id: 'eyes', seconds: 20, pose: 'eyes' },
  { id: 'wrists', seconds: 30, pose: 'wrist' },
  { id: 'walk', seconds: 60, pose: 'walk' },
]

// Mind-reset exercises. `kind` drives the visual: breath (animated circle with
// a phase pattern in seconds), gaze (far/up), still (posture), sense (grounding).
export const MIND = [
  { id: 'box', seconds: 96, kind: 'breath', pattern: [['inhale', 4], ['hold', 4], ['exhale', 4], ['hold', 4]] },
  { id: 'sigh', seconds: 45, kind: 'breath', pattern: [['inhale', 1.5], ['inhale', 1], ['exhale', 6]] },
  { id: 'ceiling', seconds: 45, kind: 'gaze', pose: 'lookup' },
  { id: 'horizon', seconds: 45, kind: 'gaze', pose: 'eyes' },
  { id: 'mountain', seconds: 60, kind: 'still', pose: 'stand' },
  { id: 'sit', seconds: 60, kind: 'still', pose: 'sit' },
  { id: 'ground', seconds: 60, kind: 'sense' },
  { id: 'handsWarm', seconds: 30, kind: 'still', pose: 'palms' },
  { id: 'tawakkul', seconds: 60, kind: 'breath', pattern: [['inhale', 4], ['exhale', 6]], faith: true },
]
