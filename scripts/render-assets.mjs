// Renders PWA PNG icons and movement GIF frames from the app's own SVG figure.
// Usage: node scripts/render-assets.mjs   (needs playwright; frames → /tmp/df-frames, icons → public/)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')
const iconSvg = readFileSync('public/icon.svg', 'utf8')
const MOVES = ['handsup', 'squat', 'sidebend', 'neck', 'shoulders', 'lunge', 'fold', 'march', 'calf', 'wrist', 'eyes', 'walk', 'reach']

// Same markup as StretchFigure.jsx (kept in sync by hand — it's small).
const figure = (move) => `
<svg class="figure fig-${move}" viewBox="0 0 120 120" width="240" height="240" fill="none" stroke="#0f766e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  <g class="body">
    <g class="leg leg-l"><path d="M60 70 L60 90"/><g class="shin-g" style="transform-origin:60px 90px"><path d="M60 90 L60 108"/></g></g>
    <g class="leg leg-r"><path d="M60 70 L60 90"/><g class="shin-g" style="transform-origin:60px 90px"><path d="M60 90 L60 108"/></g></g>
    <g class="upper" style="transform-origin:60px 70px">
      <path d="M60 70 L60 42"/>
      <g class="head-g" style="transform-origin:60px 42px"><circle cx="60" cy="30" r="8"/></g>
      <g class="arm arm-l" style="transform-origin:60px 44px"><path d="M60 44 L60 58"/><g class="fore-g" style="transform-origin:60px 58px"><path d="M60 58 L60 71"/></g></g>
      <g class="arm arm-r" style="transform-origin:60px 44px"><path d="M60 44 L60 58"/><g class="fore-g" style="transform-origin:60px 58px"><path d="M60 58 L60 71"/></g></g>
    </g>
  </g>
  ${move === 'eyes' ? '<circle class="target" cx="106" cy="18" r="4"/>' : ''}
</svg>`

const page = await (await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })).newPage()
await page.setViewportSize({ width: 240, height: 240 })

// --- icons ---
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0;background:transparent">${iconSvg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  writeFileSync(`public/icon-${size}.png`, await page.screenshot({ omitBackground: true }))
  // maskable: safe zone = inner 80%, so shrink the mark onto a full-bleed teal square
  await page.setContent(`<body style="margin:0;background:#0f766e;display:grid;place-items:center;width:${size}px;height:${size}px">${iconSvg.replace('<svg ', `<svg width="${size * 0.7}" height="${size * 0.7}" `)}</body>`)
  writeFileSync(`public/icon-maskable-${size}.png`, await page.screenshot())
}

// --- GIF frames ---
const FRAMES = 24
mkdirSync('/tmp/df-frames', { recursive: true })
await page.setViewportSize({ width: 240, height: 240 })
for (const move of MOVES) {
  await page.setContent(`<style>${css} body{margin:0;background:#f6f1e8} :root{--teal:#0f766e}</style><body>${figure(move)}</body>`)
  // find the longest animation duration on this figure so one loop = one GIF cycle
  const dur = await page.evaluate(() => {
    let max = 1
    document.querySelectorAll('.figure, .figure *').forEach((el) => {
      const d = parseFloat(getComputedStyle(el).animationDuration) || 0
      if (d > max) max = d
    })
    return max
  })
  for (let i = 0; i < FRAMES; i++) {
    const t = (i / FRAMES) * dur
    await page.evaluate((t) => {
      document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000 })
    }, t)
    writeFileSync(`/tmp/df-frames/${move}-${String(i).padStart(2, '0')}.png`, await page.screenshot())
  }
  console.log(move, dur + 's')
}
await page.context().browser().close()
