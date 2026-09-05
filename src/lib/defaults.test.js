import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, migrateSettings } from './defaults'
import { REMINDER_KINDS } from '../reminders/registry'

describe('defaults', () => {
  it('has a settings slice for every reminder kind in the registry', () => {
    for (const k of REMINDER_KINDS) expect(DEFAULT_SETTINGS[k.id]).toMatchObject({ enabled: expect.any(Boolean), intervalMin: expect.any(Number), snoozeMin: expect.any(Number) })
  })
  it('migrates legacy weekdaysOnly to workDays', () => {
    expect(migrateSettings(0, { version: 1, quietHours: { enabled: true, weekdaysOnly: true } })).toEqual({ quietHours: { enabled: true, workDays: [1, 2, 3, 4, 5] } })
    expect(migrateSettings(1, { quietHours: { weekdaysOnly: false } }).quietHours.workDays).toHaveLength(7)
    expect(migrateSettings(1, { quietHours: { workDays: [0, 1] } }).quietHours.workDays).toEqual([0, 1])
  })
})
