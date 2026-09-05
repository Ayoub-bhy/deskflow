# DeskFlow

Gentle, on-time reminders for laptop desk workers: **move every hour** (with a guided 3-minute stretch routine), **drink water**, and work in an **editable Pomodoro**. Guest-first; sign in with Google to sync settings across devices.

Built with Vite + React 19 + Firebase (Auth + Firestore), installable as a PWA.

## Why it's built this way (LLM-council decisions)

- **Wall-clock timers, never tick-counting.** Every timer stores an absolute `nextAt`/`endsAt` timestamp in `localStorage` and compares against `Date.now()` on each tick and on `visibilitychange`/`focus`. Laptop sleep, Chrome's intensive background throttling (timers collapse to ~1/min after 5 min hidden) and reloads can't make it drift. A reminder that came due while the lid was closed shows a **catch-up** ("due 12 min ago") instead of silently firing late.
- **Permission on a click, never on load.** Sound (WebAudio) and desktop notifications are unlocked by the "Enable reminders" button. If notifications are denied/unsupported, you still get the in-page toast + chime + tab-title change.
- **Never nags.** One chime + one banner per event, one-click Snooze/Skip/Done, quiet hours (default 18:00→08:30, weekends off).
- **Guest-first.** Login is optional; it only syncs *settings* to Firestore `users/{uid}` (debounced writes, well inside the free tier). Ticking state never leaves the device.
- **Security rules from day one** (`firestore.rules`): each user can only read/write their own document; everything else is closed. Firebase web config keys are public identifiers — rules are the security boundary.
- **Honest about the browser.** Reminders run while the tab is open (pinned) or the PWA is installed. A service worker alone cannot schedule future notifications when the browser is fully closed — that would need Web Push + a server, deferred.

## Run locally

```bash
npm install
npm run dev
```

Works immediately in guest mode. To enable Google sign-in:

## Firebase setup (≈5 minutes, free Spark plan)

1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `deskflow`). Analytics optional.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.** Pick a support email, save.
3. **Build → Firestore Database → Create database → Start in production mode**, choose a region.
4. Open the **Rules** tab, paste the contents of `firestore.rules`, **Publish**.
5. **Project settings (gear) → Your apps → Web (</>)** → register app `deskflow` → copy the `firebaseConfig` values.
6. `cp .env.example .env.local` and fill in the `VITE_FIREBASE_*` values. Restart `npm run dev`.
7. **Authentication → Settings → Authorized domains**: `localhost` is there already; add your hosting domain when you deploy (e.g. `ayoub-bhy.github.io` or `deskflow.web.app`).

## Deploy

### Option A — Firebase Hosting (recommended, custom domain + HTTPS)

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # select your project
npm run build
firebase deploy               # deploys hosting + firestore rules
```

### Option B — GitHub Pages (workflow included)

`.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to GitHub Pages.

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Repo **Settings → Secrets and variables → Actions → New repository secret** for each `VITE_FIREBASE_*` key from your `.env.local`.
3. If the site is served at `https://<user>.github.io/deskflow/`, set `base: '/deskflow/'` in `vite.config.js` (and the manifest `start_url`) — or use a custom domain to keep `/`.
4. Add the Pages domain to Firebase **Authorized domains**.

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
  firebase.js          Firebase init (no-op when env vars are missing → guest mode)
  lib/
    defaults.js        default settings, stretch routine, desk tips
    time.js            formatting + quiet-hours logic
    alerts.js          WebAudio chime, Notification API helpers
    storage.js         localStorage helpers, deepMerge
  hooks/
    useNow.js          coarse ticker that also fires on visibility/focus
    useReminder.js     wall-clock reminder engine (Move & Water are two instances)
    usePomodoro.js     editable Pomodoro, remaining = endsAt - now
    useSettings.js     localStorage + debounced Firestore mirror
    useAuth.js         Google sign-in (popup → redirect fallback)
  components/          Landing, Header, ReminderCard, PomodoroCard, BreakOverlay, SettingsPanel, Ring, StretchFigure
firestore.rules        per-user isolation
firebase.json          hosting + rules config
```

## Roadmap (deferred on purpose)

- Web Push via Cloud Functions/FCM so reminders survive a closed browser.
- Browser extension (`chrome.alarms`) for OS-level reliability.
- Streaks / "desk health" history (schema will live under `users/{uid}/days/{date}`).
