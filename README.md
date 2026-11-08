# FIT open times

A one-page site that shows open appointment times for the Fitness Institute of Texas. Clients tap a
time and their phone opens a prefilled text to 512-703-0780. Tapping the phone number also opens a
text, not a call. Staff reply to confirm and book it by hand in Full Slate.

There is no backend, API or database. `public/availability.json` is the only data, and it's
refreshed by committing a new copy. GitHub Pages redeploys on every push to `main`. See
[PLAN.md](PLAN.md) for the full design and phases.

## Config

- `public/index.html`: business name, phone, sign-off, news blurb, and each service's duration and
  prep notes (CONFIG block at the top of the script)
- `scripts/validate.js` and `scripts/sample.js`: `TIMEZONE` and `DAYS_AHEAD`

## Run locally

```bash
npm install
npm run sample      # write fresh fake data (Phase 1 only)
npm start           # http://localhost:3000
```

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Serves `public/` locally for preview |
| `npm run validate` | Checks `public/availability.json`. Must pass before any commit of that file |
| `npm run sample` | Writes fake data with `updated` set to now (America/Chicago) |
| `npm run sample -- --hours-ago 3` | Same, but 3 hours old, to see the stale banner |
| `npm run sample -- --empty` | No slots, to see the empty state |

`validate` requires `updated` to be within the last 15 minutes. That's on purpose for the hourly
sync, so an older sample file fails until you run `npm run sample` again.

## Deploy (GitHub Pages)

1. Repo **Settings > Pages > Build and deployment > Source**: choose **GitHub Actions**. You only
   do this once.
2. Every push to `main` runs `.github/workflows/pages.yml`. It checks `availability.json` is
   well-formed and then publishes `public/`. If the check fails, the previous site stays up.
3. The site is at `https://rw9296.github.io/fitschedule/`. The **Actions** tab shows each deploy.

The fonts (Barlow Condensed, Source Sans 3) are self-hosted in `public/fonts/` under the SIL Open
Font License, so the page makes no requests to other sites.
