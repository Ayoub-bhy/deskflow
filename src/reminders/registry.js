/**
 * Single source of truth for every "kind" DeskFlow tracks.
 *
 * Adding a reminder = add one entry here (+ its strings under `reminder.<id>`
 * and `alerts.<id>` in each language file — `npm run i18n:check` enforces it).
 * Everything else (cards, settings, history, board, heatmap) iterates this table.
 *
 *   id             stable key: settings[id], history[day][id], events.kind, i18n prefix
 *   reminder       true → has a timer card; false → tracked only (pomodoro focus blocks)
 *   icon / tone    Icon.jsx name and the badge/ring colour token (see index.css .badge-*, .ring-*)
 *   color          CSS var used by charts
 *   goal           per-working-day goal shown on the board and heatmap
 *   defaults       initial settings for reminder kinds
 *   overlay        which guided overlay the card opens ('move' | 'mind' | null)
 *   chime          relative chime volume when the overlay advances a step
 *   faith          true → only shown/active when the Faith layer is enabled
 */
export const KINDS = [
  { id: 'move', reminder: true, icon: 'move', tone: 'teal', color: 'var(--teal)', goal: 8, defaults: { enabled: true, intervalMin: 60, snoozeMin: 5 }, overlay: 'move', chime: 0.5 },
  { id: 'water', reminder: true, icon: 'water', tone: 'blue', color: 'var(--blue)', goal: 8, defaults: { enabled: true, intervalMin: 45, snoozeMin: 10 }, overlay: null },
  { id: 'focus', reminder: false, icon: 'focus', tone: 'coral', color: 'var(--coral)', goal: 6 },
  { id: 'mind', reminder: true, icon: 'mind', tone: 'violet', color: 'var(--violet)', goal: 3, defaults: { enabled: true, intervalMin: 120, snoozeMin: 15 }, overlay: 'mind', chime: 0.3 },
  { id: 'dhikr', reminder: true, icon: 'dhikr', tone: 'green', color: 'var(--green)', goal: 5, defaults: { enabled: true, intervalMin: 90, snoozeMin: 15 }, overlay: 'dhikr', chime: 0.3, faith: true },
  { id: 'prayer', reminder: false, icon: 'prayer', tone: 'gold', color: 'var(--gold)', goal: 5, faith: true },
]

/** Kinds visible for the current mode. */
export const visibleKinds = (faithOn) => KINDS.filter((k) => faithOn || !k.faith)

export const REMINDER_KINDS = KINDS.filter((k) => k.reminder)
export const KIND_IDS = KINDS.map((k) => k.id)
export const GOALS = Object.fromEntries(KINDS.map((k) => [k.id, k.goal]))
export const byId = Object.fromEntries(KINDS.map((k) => [k.id, k]))

/** Default settings slice for all reminder kinds: { move: {...}, water: {...}, mind: {...} } */
export const REMINDER_DEFAULTS = Object.fromEntries(REMINDER_KINDS.map((k) => [k.id, { ...k.defaults }]))
