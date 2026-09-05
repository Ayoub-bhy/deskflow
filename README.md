# DeskFlow

Gentle, on-time reminders for laptop desk workers: **move every hour** (with a guided 3-minute stretch routine), **drink water**, and work in an **editable Pomodoro**. Guest-first; sign in with Google to sync settings and progress across devices.

Built with Vite + React 19 + Supabase (Google auth + Postgres with Row Level Security), installable as a PWA. Includes a progress board (today's goals, 7-day chart, streak).

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

Data you collect, per user: `profiles.settings` (jsonb), `profiles.history` (30 days of daily counts), and one `events` row per action (`move` / `water` / `focus`) with a timestamp. Query `daily_totals` in the SQL editor or Table Editor for dashboards.

## Deploy to GitHub Pages (workflow included)

`.github/workflows/deploy.yml` builds on every push to `main` with `VITE_BASE_PATH=/deskflow/` and publishes `dist/` to Pages.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo **Settings → Secrets and variables → Actions → New repository secret**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from step 5 above). Until you add them the site still works in guest mode.
3. Push (or **Actions → Build & deploy → Run workflow**). The site appears at `https://<user>.github.io/deskflow/`.
4. Make sure that URL is in Supabase **Redirect URLs** (step 4 above), otherwise Google login bounces back to localhost.

Custom domain instead? Set the domain in Pages settings, change `VITE_BASE_PATH` in the workflow to `/`, and update the Supabase Site URL.

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

## Project structure

```
src/
  supabase.js          Supabase client (null when env vars are missing → guest mode)
  lib/
    defaults.js        default settings, stretch routine, desk tips
    time.js            formatting + quiet-hours logic
    alerts.js          WebAudio chime, Notification API helpers
    storage.js         localStorage helpers, deepMerge
    cloud.js           profiles upsert/fetch + events insert
  hooks/
    useNow.js          coarse ticker that also fires on visibility/focus
    useReminder.js     wall-clock reminder engine (Move & Water are two instances)
    usePomodoro.js     editable Pomodoro, remaining = endsAt - now
    useSettings.js     localStorage + debounced Supabase mirror
    useHistory.js      daily counters, 7-day/streak maths, events logging
    useAuth.js         Google sign-in via Supabase Auth (OAuth redirect)
  components/          Landing, Header, ReminderCard, PomodoroCard, ProgressBoard, BreakOverlay, SettingsPanel, Ring, StretchFigure
supabase/schema.sql    tables, RLS policies, daily_totals view
.github/workflows/     GitHub Pages deploy
```

## Roadmap (deferred on purpose)

- Web Push via a Supabase Edge Function so reminders survive a closed browser.
- Browser extension (`chrome.alarms`) for OS-level reliability.
- Weekly email digest from `daily_totals` (Supabase cron + Resend).
