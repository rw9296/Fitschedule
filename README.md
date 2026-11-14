# FIT open times

A one-page site that shows open appointment times for the Fitness Institute of Texas. Clients tap a
time and their phone opens a prefilled text to 512-703-0780. Tapping the phone number also opens a
text, not a call. Staff reply to confirm and book it by hand in Full Slate.

There is no backend, API or database. `public/availability.json` is the only data, and it's
refreshed by committing a new copy. GitHub Pages redeploys on every push to `main`. See
[PLAN.md](PLAN.md) for the full design and phases, and [CONTEXT.md](CONTEXT.md) for business
facts (services, staff) and the log of decisions made since.

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
| `npm test` | Tests the openings calculator's rules (cart, DXA limit, staff, RMR window, weekends…) |
| `npm run openings -- days.jsonl` | Works out openings from `read-day.js` results (one per line) |

`validate` requires `updated` to be within the last 15 minutes. That's on purpose for the hourly
sync, so an older sample file fails until you run `npm run sample` again.

## Deploy (GitHub Pages)

1. Repo **Settings > Pages > Build and deployment > Source**: choose **GitHub Actions**. You only
   do this once.
2. Every push to `main` runs `.github/workflows/pages.yml`. It checks `availability.json` is
   well-formed and then publishes `public/`. If the check fails, the previous site stays up.
3. The site is at **https://fitopenings.com** (custom domain, set in repo Settings > Pages).
   `www.fitopenings.com` and the old `https://rw9296.github.io/Fitschedule/` redirect to it.
   The **Actions** tab shows each deploy.
4. DNS for fitopenings.com is at Porkbun (registered 2026-11-14): four `A` records for the root
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and `www` CNAME `rw9296.github.io`.
   Keep auto-renew on so the link never breaks.

The fonts (Barlow Condensed, Source Sans 3) are self-hosted in `public/fonts/` under the SIL Open
Font License, so the page makes no requests to other sites.

## Run the sync by hand (Phase 2)

This runs on the Mac where Chrome is logged in to Full Slate, not in the cloud.

One-time setup:

```bash
git clone https://github.com/rw9296/fitschedule.git ~/fitschedule
```

```bash
cd ~/fitschedule && npm install
```

Also install the Claude in Chrome extension in that Chrome and sign in.

Each run: open Claude Code in the folder (`cd ~/fitschedule && claude`) and say `/sync-availability`.

- **Source:** only the logged-in staff schedule (`app.fullslate.com/schedule`), read through
  Claude in Chrome. There is no public booking page. The sync reads Rachel's, Xavier's and Sammy's
  working hours and appointments and works out openings from the rules in `CONTEXT.md`.
  Weekdays only: `npm run validate` rejects Saturday and Sunday dates.
- **First run (discovery):** while `READING_NOTES` in
  `.claude/skills/sync-availability/SKILL.md` is `TBD`, the skill only reads the schedule and
  writes how it reads as text to `logs/discovery-*.md`. Fill in the "Reading the schedule" notes,
  set `READING_NOTES` to `done`, then commit.
- **Reading the page:** entry text in Full Slate doesn't name the staff member, so the sync runs the
  read-only script `.claude/skills/sync-availability/read-day.js` on each day in Day view. It
  returns each person's working hours and bookings. Discovery was done on 2026-11-11.
- **After that:** each run reads the schedule, works out the openings with
  `scripts/compute-openings.js` (the rules from `CONTEXT.md`, as code), builds the file with
  `scripts/write-availability.js`, validates it, and commits and pushes only
  `public/availability.json`.
- **Failures:** if validation fails or the slot count drops more than 60%, nothing is committed
  and a note goes to `logs/` (not committed).
