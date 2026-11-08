# availability-site

A one-page site that shows open appointment times. Clients tap a time and their phone opens a
prefilled text to the booking number. The owner replies to confirm and books it by hand in Full Slate.

There is no backend, API or database. `public/availability.json` is the only data, and it's
refreshed by committing a new copy. Railway redeploys on every push. See [PLAN.md](PLAN.md) for the
full design and phases.

## Config

Fill in the values at the top of [PLAN.md](PLAN.md), then copy them to:

- `public/index.html`: `BUSINESS_NAME` and `BOOKING_PHONE` (CONFIG block at the top of the script)
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
| `npm start` | Serves `public/` on `$PORT` (default 3000) |
| `npm run validate` | Checks `public/availability.json`. Must pass before any commit of that file |
| `npm run sample` | Writes fake data with `updated` set to now (America/Chicago) |
| `npm run sample -- --hours-ago 3` | Same, but 3 hours old, to see the stale banner |
| `npm run sample -- --empty` | No slots, to see the empty state |

`validate` requires `updated` to be within the last 15 minutes. That's on purpose for the hourly
sync, so an older sample file fails until you run `npm run sample` again.

## Deploy (Railway)

1. New Project > Deploy from GitHub repo > pick this repo.
2. Railway detects Node, runs `npm install` and then `npm start`. No other settings are needed.
3. Settings > Networking > Generate Domain to get a public URL.
