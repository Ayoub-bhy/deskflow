# DeskFlow

Gentle, on-time reminders for laptop desk workers: **move every hour** (guided 3-minute routine), **drink water**, **reset your mind** (2-minute exercises that do the opposite of scrolling), and work in an **editable Pomodoro**. Available in **English, العربية (RTL) and Français**. Guest-first; sign in with Google to sync settings and your full history across devices.

Built with Vite + React 19 + Supabase (Google auth + Postgres with Row Level Security), installable as a PWA on desktop, Android and iOS. Includes a progress board (today's goals, 7-day chart, streak), a working-days picker, an emoji-free icon set drawn in the logo's style, and an articulated animated figure (squats, hands up, side bends, marching…) that also ships as GIFs in `public/gifs/`.

## Why it's built this way (LLM-council decisions)

- **Wall-clock timers, never tick-counting.** Every timer stores an absolute `nextAt`/`endsAt` timestamp in `localStorage` and compares against `Date.now()` on each tick and on `visibilitychange`/`focus`. Laptop sleep, Chrome's intensive background throttling (timers collapse to ~1/min after 5 min hidden) and reloads can't make it drift. A reminder that came due while the lid was closed shows a **catch-up** ("due 12 min ago") instead of silently firing late.
- **Permission on a click, never on load.** Sound (WebAudio) and desktop notifications are unlocked by the "Enable reminders" button. If notifications are denied/unsupported, you still get the in-page toast + chime + tab-title change.
- **Never nags.** One chime + one banner per event, one-click Snooze/Skip/Done, quiet hours (default 18:00→08:30, weekends off).
- **Guest-first.** Login is optional; it syncs *settings* and the 30-day *history* to a `profiles` row and appends each action to an `events` table (debounced, well inside the free tier). Ticking timer state never leaves the device.
- **Row Level Security from day one** (`supabase/schema.sql`): each user can only read/write their own rows. The anon key is a public client key — RLS is the security boundary.
- **Honest about the browser.** Reminders run while the tab is open (pinned) or the PWA is installed. A service worker alone cannot schedule future notifications when the browser is fully closed — that would need Web Push + a server, deferred.

## Run locally

```bash
npm install
npm run dev
```

Works immediately in guest mode. To enable Google sign-in:

## Supabase setup (≈5 minutes, free plan)

1. <https://supabase.com/dashboard> → **New project** (e.g. `deskflow`). Note the database password.
2. **SQL Editor → New query** → paste `supabase/schema.sql` → **Run**. This creates `profiles`, `events`, the `daily_totals` view and the RLS policies.
3. **Authentication → Providers → Google → Enable.** You need a Google OAuth client:
   - <https://console.cloud.google.com/apis/credentials> → **Create credentials → OAuth client ID → Web application**.
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows this exact URL on the Google provider page).
   - Paste the Client ID and Client secret into Supabase, save.
4. **Authentication → URL Configuration**: set **Site URL** to where the app lives (e.g. `https://ayoub-bhy.github.io/deskflow/`) and add `http://localhost:5173/**` plus your Pages URL to **Redirect URLs**.
5. **Project Settings → API**: copy the **Project URL** and **anon public** key.
6. Locally: `cp .env.example .env.local`, fill both values, restart `npm run dev`.

Data you collect, per user: `profiles.settings` (jsonb), `profiles.history` (all daily counts since first use), and one `events` row per action (`move` / `water` / `focus` / `mind`) with a timestamp. Existing projects created before v4: run `supabase/migrations_002_mind.sql` once. Query `daily_totals` in the SQL editor or Table Editor for dashboards.

## Deploy to GitHub Pages (workflow included)

`.github/workflows/deploy.yml` builds on every push to `main` with `VITE_BASE_PATH=/deskflow/` and publishes `dist/` to Pages.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo **Settings → Secrets and variables → Actions → New repository secret**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from step 5 above). Until you add them the site still works in guest mode.
3. Push (or **Actions → Build & deploy → Run workflow**). The site appears at `https://<user>.github.io/deskflow/`.
4. Make sure that URL is in Supabase **Redirect URLs** (step 4 above), otherwise Google login bounces back to localhost.

Custom domain instead? Set the domain in Pages settings, change `VITE_BASE_PATH` in the workflow to `/`, and update the Supabase Site URL.

## Languages

`src/i18n/{en,ar,fr}.js` hold every string, including stretch cues, mind exercises, desk tips and the post-work / day-off advice. The language is auto-detected from the browser, switchable from the landing page, header or Settings, and stored in settings (so it syncs). Arabic flips the document to `dir="rtl"`; layout uses logical properties so nothing else is needed. To add a language: copy `en.js`, translate, register it in `src/i18n/index.jsx`.

## Mind reset

A fourth reminder (default every 120 min) opens a 2-minute overlay with three exercises chosen from `MIND` in `defaults.js`: box breathing / physiological sigh (animated circle with phase + countdown), look up / far gaze (soft, unfocused eyes), stand or sit still like a mountain, 5-4-3-2-1 grounding, warm palms over the eyes. One thing on screen, big type, nothing to scroll.

## History

Daily counts are kept for the whole life of the account (≈20 KB/year) — in `localStorage` for guests and in `profiles.history` when signed in (merged by max per day across devices). The History view shows lifetime totals, best day, average per active day, active days, and a per-month heatmap for each metric; Settings and History both offer a CSV export.

## Advice

The bottom card is context-aware: a desk tip during working hours, **post-work recovery advice** after your quiet-hours start on a working day, and **day-off advice** on non-working days. All three lists live in the language files.

## Install on Android / iOS / desktop

DeskFlow is a PWA. On **Android Chrome** open the site → an "Install DeskFlow as an app" button appears in the footer (or use the browser menu → *Add to Home screen*); it then launches full-screen with its own icon. On **iOS Safari**: Share → *Add to Home Screen*. On desktop Chrome/Edge: the install icon in the address bar or the footer button. Icons: `public/icon-*.png` (any + maskable), generated from `icon.svg` by `scripts/render-assets.mjs`.

For a Play Store listing later, wrap the same URL with a Trusted Web Activity (Bubblewrap) — no code changes needed.

## Movement GIFs

`public/gifs/*.gif` (240×240, 24 frames, ~40 KB each): `handsup`, `squat`, `sidebend`, `march`, `calf`, `neck`, `shoulders`, `lunge`, `fold`, `wrist`, `eyes`, `walk`, `reach`. They are rendered from the same CSS keyframes the app uses (`StretchFigure.jsx` + `index.css`), so the app and the GIFs always match. Regenerate with `node scripts/render-assets.mjs` (needs Playwright) and assemble with Pillow, or just use them in docs, Slack, or the README.

## Seedance / Higgsfield video assets (optional)

The UI works with animated SVG figures. If you generate clips (Seedance 2.5 needs a Higgsfield Plus plan; the Free plan rejects all generations via the API), drop them in `public/videos/` and they are picked up automatically, lazily, muted:

| File | Prompt (16:9, 5 s, no audio, 480–720p) |
|---|---|
| `hero.mp4` | Calm ambient loop: soft morning light drifting across a minimal wooden desk with a closed laptop, a glass of water and a small plant, slow floating dust, gentle push-in, muted teal and warm sand palette, no people, no text |
| `reach.mp4` | Relaxed office worker stands up from a desk chair, raises both arms overhead and stretches slowly, bright minimal studio, teal and sand tones, medium shot, no text |
| `neck.mp4` | Office worker standing beside a desk does a slow neck stretch tilting head side to side, calm minimal room, teal and sand palette, medium shot, no text |
| `shoulders.mp4` | Office worker rolls shoulders slowly backwards, opening the chest, minimal studio, teal and sand palette, medium shot, no text |
| `lunge.mp4` | Office worker in a half-kneeling hip flexor stretch beside a desk, pelvis tucked, calm minimal room, teal and sand palette, no text |
| `fold.mp4` | Office worker does a slow standing forward fold with soft knees, arms hanging, minimal studio, teal and sand palette, no text |
| `eyes.mp4` | Office worker turns from a laptop to gaze calmly out of a bright window into the distance, minimal room, teal and sand palette, no text |
| `wrist.mp4` | Close-up of an office worker gently stretching the wrist, arm extended palm up, other hand pulling fingers back, minimal studio, no text |
| `walk.mp4` | Office worker walks away from a desk toward a window carrying a glass of water, bright minimal office, teal and sand palette, no text |

Videos are excluded from the PWA precache on purpose.

## Architecture (after the code-structure council)

The rule: **hooks own behaviour, `lib/` owns pure logic, components own pixels, the registry owns the vocabulary.**

- `src/reminders/registry.js` — the single table of kinds (`move`, `water`, `focus`, `mind`): icon, colour, goal, defaults, overlay. Cards, settings, board, history and the i18n check all iterate it. **Adding a reminder = one entry here + its strings in each language file.**
- `src/lib/reminderEngine.js` — pure wall-clock state machine (`tick`, `done`, `snooze`, `skip`, `reanchor`, `derive`). No React, no `Date.now()`; every function takes `now`.
- `src/lib/history.js` — pure history maths (`increment`, `mergeMax`, `computeStreak`, `computeStats`, `toCsv`).
- `src/lib/storage.js` — versioned `localStorage` (`{v, data}` envelope + `migrate`), cross-tab `onExternalChange`.
- `src/hooks/useSyncedDoc.js` — the one local-first/cloud-mirrored document primitive (debounce, retry with backoff, cross-tab merge, sign-in merge). `useSettings` and `useHistory` are thin wrappers.
- `src/hooks/useReminders.js` — all timers in one hook driven by the registry + engine; one `reminders` document in storage (legacy per-kind keys are imported once).
- `src/hooks/useAlertCenter.js` — chime / notification / banner / tab-title side effects behind `raise(key)`.
- `src/hooks/useStepTimer.js` — shared step sequencer for the movement and mind overlays.
- `src/App.jsx` — composition only.

Tests (`npm test`, Vitest + Testing Library): quiet-hours logic, the reminder engine (fires once after sleep, quiet skip, re-anchor, day rollover), history merge/streak/stats, versioned storage + migrations, hook wiring (`onDue` exactly once, legacy import), and i18n completeness (key sets, types, placeholders, registry ↔ strings). `npm run check` = i18n check + tests + build; CI runs it before every deploy.

## Project structure

```
src/
  supabase.js          Supabase client (null when env vars are missing → guest mode)
  reminders/registry.js  the kinds table (see Architecture)
  lib/
    defaults.js        default settings (+ migrations), stretch + mind exercise structure
    reminderEngine.js  pure timer state machine
    history.js         pure history maths
    time.js            formatting + quiet-hours logic
    alerts.js          WebAudio chime, Notification API helpers
    storage.js         versioned localStorage, cross-tab events, deepMerge
    cloud.js           profiles upsert/fetch + events insert
  hooks/
    useNow.js          coarse ticker that also fires on visibility/focus
    useReminders.js    all reminder timers (registry × engine)
    usePomodoro.js     editable Pomodoro, remaining = endsAt - now
    useSyncedDoc.js    local-first + cloud-mirrored document primitive
    useSettings.js     settings on useSyncedDoc
    useHistory.js      history on useSyncedDoc + events logging
    useAlertCenter.js  alert side effects
    useStepTimer.js    step sequencer for overlays
    useAuth.js         Google sign-in via Supabase Auth (OAuth redirect)
  i18n/                en.js, ar.js, fr.js + provider/useT hook
  components/          Landing, Header, ReminderCard, PomodoroCard, ProgressBoard, AdviceCard, HistoryView, BreakOverlay, MindOverlay, SettingsPanel, Ring, Icon, StretchFigure
  hooks/useInstallPrompt.js  PWA install button (beforeinstallprompt)
scripts/render-assets.mjs  renders PNG icons + GIF frames from the SVG figure
supabase/schema.sql    tables, RLS policies, daily_totals view
.github/workflows/     GitHub Pages deploy
```

## Roadmap (deferred on purpose)

- Web Push via a Supabase Edge Function so reminders survive a closed browser.
- Browser extension (`chrome.alarms`) for OS-level reliability.
- Weekly email digest from `daily_totals` (Supabase cron + Resend).
