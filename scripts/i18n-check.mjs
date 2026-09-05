// Fails when any language is missing a key that English has, or has a key
// English lacks, or when a reminder kind in the registry lacks its strings.
// Usage: node scripts/i18n-check.mjs   (also run by `npm run check` and CI)
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const load = async (f) => (await import(pathToFileURL(path.join(root, 'src/i18n', f)).href)).default
const en = await load('en.js')
const langs = { ar: await load('ar.js'), fr: await load('fr.js') }

export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = Array.isArray(v) ? `array(${v.length})` : typeof v
  }
  return out
}

const base = flatten(en)
let problems = 0
for (const [name, dict] of Object.entries(langs)) {
  const flat = flatten(dict)
  for (const k of Object.keys(base)) if (!(k in flat)) { console.error(`[${name}] missing: ${k}`); problems++ }
  for (const k of Object.keys(flat)) if (!(k in base)) { console.error(`[${name}] extra (not in en): ${k}`); problems++ }
  for (const k of Object.keys(base)) if (k in flat && flat[k] !== base[k] && !(flat[k].startsWith('array') && base[k].startsWith('array'))) { console.error(`[${name}] type mismatch: ${k} (${flat[k]} vs ${base[k]})`); problems++ }
}

// Registry ↔ i18n contract
const registrySrc = readFileSync(path.join(root, 'src/reminders/registry.js'), 'utf8')
const ids = [...registrySrc.matchAll(/\bid: '(\w+)'/g)].map((m) => m[1])
for (const id of ids) {
  if (!(`kinds.${id}` in base)) { console.error(`[en] registry kind '${id}' has no kinds.${id} label`); problems++ }
  const isReminder = new RegExp(`id: '${id}', reminder: true`).test(registrySrc)
  if (isReminder) for (const need of ['title', 'verb', 'done']) if (!(`reminder.${id}.${need}` in base)) { console.error(`[en] reminder '${id}' missing reminder.${id}.${need}`); problems++ }
  if (isReminder && !(`alerts.${id}` in base)) { console.error(`[en] reminder '${id}' missing alerts.${id}`); problems++ }
}

if (problems) { console.error(`\ni18n check failed: ${problems} problem(s)`); process.exit(1) }
console.log(`i18n check passed: ${Object.keys(base).length} keys × ${Object.keys(langs).length + 1} languages, ${ids.length} kinds`)
