import { describe, it, expect } from 'vitest'
import en from './en'
import ar from './ar'
import fr from './fr'
import { REMINDER_KINDS, KIND_IDS } from '../reminders/registry'

const flatten = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, key, out) : (out[key] = Array.isArray(v) ? 'array' : typeof v)
  }
  return out
}
const base = flatten(en)

describe('i18n completeness', () => {
  for (const [name, dict] of Object.entries({ ar, fr })) {
    it(`${name} has exactly the English key set with matching types`, () => {
      const flat = flatten(dict)
      expect(Object.keys(flat).sort()).toEqual(Object.keys(base).sort())
      for (const k of Object.keys(base)) expect(flat[k], k).toBe(base[k])
    })
    it(`${name} declares its direction and locale`, () => {
      expect(['ltr', 'rtl']).toContain(dict.meta.dir)
      expect(dict.meta.locale).toBe(name)
    })
  }
  it('every registry kind has a label, and every reminder kind has card + alert strings', () => {
    for (const id of KIND_IDS) expect(en.kinds[id], id).toBeTypeOf('string')
    for (const k of REMINDER_KINDS) {
      expect(en.reminder[k.id]).toMatchObject({ title: expect.any(String), verb: expect.any(String), done: expect.any(String) })
      if (k.overlay) expect(en.reminder[k.id].start, k.id).toBeTypeOf('string')
      expect(en.alerts[k.id]).toHaveLength(2)
    }
  })
  it('placeholders match across languages', () => {
    const ph = (s) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort().join() : '')
    const walk = (a, b, p = '') => {
      for (const k of Object.keys(a)) {
        if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) walk(a[k], b[k], `${p}${k}.`)
        else if (typeof a[k] === 'string') expect(ph(b[k]), `${p}${k}`).toBe(ph(a[k]))
      }
    }
    walk(en, ar)
    walk(en, fr)
  })
})
