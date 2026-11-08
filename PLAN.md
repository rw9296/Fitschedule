# Availability Site + Hourly Full Slate Sync

Paste this file into an empty folder and tell Claude Code: "Read PLAN.md and build Phase 1."
Work one phase at a time. Do not start a phase until the previous one is verified.

## Fill these in before starting

- FULLSLATE_SCHEDULE_URL: https://app.fullslate.com/schedule (logged-in staff schedule)
- BOOKING_PHONE: +15127030780 (shown as 512-703-0780)
- BUSINESS_NAME: Fitness Institute of Texas · UT Austin
- SERVICES_TO_SHOW: DXA + VO₂, VO₂ only, DXA only, Bone Density FIT, Muscle FIT
  (confirm these match the names in Full Slate exactly during Phase 2)
- DAYS_AHEAD: 14
- TIMEZONE: America/Chicago
- GITHUB_REPO: github.com/rw9296/fitschedule
- HOSTING: GitHub Pages, deployed by `.github/workflows/pages.yml` on every push to `main`

> BOOKING_PHONE, BUSINESS_NAME, and per-service duration/prep text are in `public/index.html`
> (CONFIG block at the top of the script). TIMEZONE and DAYS_AHEAD are in `scripts/validate.js`
> and `scripts/sample.js` (constants at the top).

## What we are building

A static landing page on GitHub Pages that shows open appointment slots. Clients tap a slot and their
phone opens a prefilled text to BOOKING_PHONE. The owner confirms by replying and books it manually
in Full Slate.

Availability is refreshed hourly by a Claude scheduled task running on the owner's Mac. The task
reads Full Slate in Chrome (already logged in), rewrites `public/availability.json`, and pushes that
one file. A GitHub Actions workflow redeploys GitHub Pages on push (usually within a minute).

There is no API, no backend, no database. The repo is the database.

## Hard rules for every phase

- Full Slate is read only. Never click Book, Cancel, Edit, Reschedule, Delete, or any form submit
  inside Full Slate. Never type into Full Slate.
- Never push availability.json that fails validation. Leave the previous file in place.
- All times are stored in TIMEZONE as local wall-clock times. The page never converts timezones.
- No secrets in the repo. The phone number is public by design and is the only "secret-looking"
  thing allowed in the code.

## Phase 1: Static site, deployed, with fake data

Goal: the page is live on GitHub Pages and the sms links work on a real phone. No Full Slate yet.

### Files to create

```
availability-site/
  package.json
  public/
    index.html
    availability.json      (hand-written sample data for now)
  scripts/
    validate.js
  CLAUDE.md
  .gitignore
  README.md
```

### Hosting

Zero-build static hosting on GitHub Pages. `.github/workflows/pages.yml` runs on every push to
`main`: it checks `availability.json` with `validate.js --structure-only` (so a malformed file never
deploys and the previous site stays up), then publishes the `public/` folder.
`npm start` serves `public/` locally for previews only (`serve` is a dev dependency).

### availability.json schema

```json
{
  "updated": "2026-11-08T15:00:00",
  "timezone": "America/Chicago",
  "days_ahead": 14,
  "source": "public_booking_page",
  "days": [
    {
      "date": "2026-11-10",
      "slots": [
        { "time": "10:00", "service": "Initial Consultation" },
        { "time": "14:30", "service": "Follow Up" }
      ]
    }
  ]
}
```

Rules:

- `updated` is local time in TIMEZONE, ISO format, no Z suffix
- `date` is YYYY-MM-DD, `time` is 24h HH:MM
- Days with zero slots are omitted
- Sorted by date, then time
- `service` may be omitted if SERVICES_TO_SHOW is a single service

### index.html requirements

Single file, inline CSS and JS, no frameworks, no build step. Mobile first, this will be opened
from a text message 90 percent of the time.

Content, top to bottom:

1. BUSINESS_NAME as the heading, one line of what to do: "Tap a time to text me and claim it"
2. "Last updated 2:00 PM, Sat Nov 8" rendered from `updated`
3. Stale banner, shown only when `updated` is more than 2 hours old: "This list may be out of date.
   Text to confirm before planning around a time."
4. Slots grouped by day. Day header like "Monday, Nov 10". Each slot is a large tappable button
   showing "10:00 AM" and the service name if present
5. Empty state if no days: "Nothing open in the next two weeks. Text me and I'll find something."
6. Footer: BOOKING_PHONE as plain readable text, "First come first served. Your spot is held once I
   text you back."

Each slot is an anchor:

- Body text: `Hi! I'd like to book Monday Nov 10 at 10:00 AM for Initial Consultation.`
- iOS and macOS Safari: `sms:+1XXXXXXXXXX&body=<url-encoded>`
- Everything else: `sms:+1XXXXXXXXXX?body=<url-encoded>`
- Detect with `/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)`
- On a desktop browser that does nothing with sms links, fall back to showing the body text and
  phone number in a small modal so the person can copy it

Fetch `availability.json?t=<Date.now()>` so the GitHub Pages CDN (10 minute cache) never serves a stale copy.

Keep the design clean and calm: one accent color, system font stack, 16px side padding, large tap
targets (min 48px tall), high contrast. No icons, no images, no external requests of any kind.

### scripts/validate.js

Node script, no dependencies. Exits 1 with a clear message on any failure. Used by the hourly task
before every commit.

Checks:

- File parses as JSON
- `updated` parses as a date and is within the last 15 minutes
- `timezone` equals TIMEZONE
- Every date is today or later and within DAYS_AHEAD + 1 days
- Every time matches `^\d{2}:\d{2}$` and is between 06:00 and 22:00
- Total slot count is between 0 and 300
- No duplicate date + time + service (different services may share a start time)
- Days and slots are sorted

Also print a one-line summary on success: `OK: 23 slots across 9 days, updated 15:00.`

`--structure-only` skips the freshness and date-window checks. Only the deploy workflow uses it.

### CLAUDE.md

```markdown
# availability-site

Static page showing Full Slate openings so clients can text to book.
Read PLAN.md for the full design. Hard rules:

- Full Slate is READ ONLY. Never click Book, Cancel, Edit, Reschedule, Delete,
  or submit any form there. Never type into Full Slate fields.
- Never commit public/availability.json unless `npm run validate` passes.
- Times are local wall-clock in America/Chicago. Never convert timezones.
- public/index.html is a single file with no build step and no external requests.
- Commits from the hourly task touch only public/availability.json.

Config lives at the top of PLAN.md under "Fill these in".
```

### Phase 1 verification

- `npm install && npm start`, open localhost, confirm the fake data renders
- Push to GITHUB_REPO. In the repo's Settings > Pages, set Source to "GitHub Actions". Confirm the
  "Deploy to GitHub Pages" workflow succeeds and the site serves at the Pages URL
- Open the Pages URL on an iPhone and an Android if available. Tap a slot. Confirm Messages opens
  with the right number and body
- Hand-edit `updated` to 3 hours ago, push, confirm the stale banner appears
- `npm run validate` passes on the sample, and fails when you break a date

Stop here and get the owner to look at it on her phone. Design tweaks happen now, not after the
automation is built.

## Phase 2: The sync skill, run manually

Goal: Claude can refresh availability.json from Full Slate on command, reliably, five times in a row.

### Create .claude/skills/sync-availability/SKILL.md

````markdown
---
name: sync-availability
description: Read current openings from Full Slate in Chrome and update public/availability.json, validate, commit and push. Read only against Full Slate.
---

# Sync availability from Full Slate

## Source page

Source: the logged-in Full Slate schedule at https://app.fullslate.com/schedule,
in the owner's already-open Chrome session.

(Decide during Phase 2 whether a public booking page exists and reads more reliably
as text than the calendar grid. If so, prefer it and record `public_booking_page`.)

## Steps

1. Use Claude in Chrome. Open a NEW tab for the source page. Do not reuse or
   disturb the owner's existing tabs.
2. If a service picker appears, step through each service in SERVICES_TO_SHOW
   (or all services if set to `all`). For each service, read every day from
   today through today + DAYS_AHEAD.
3. Read the page with get_page_text or read_page FIRST. Only take a screenshot
   if the text read is empty or clearly incomplete. Record which method you used
   in the `source` field: `public_booking_page`, `public_booking_page_vision`,
   or `dashboard_calendar`.
4. Build public/availability.json exactly matching the schema in PLAN.md.
   `updated` is the current local time in America/Chicago, no Z suffix.
   Omit days with no slots. Sort everything.
5. Run `npm run validate`. If it fails, STOP. Do not commit. Write the failure
   and what the page looked like to `logs/sync-YYYY-MM-DD-HHMM.md` and end.
6. Compare with the previous file. If the slot count dropped by more than 60
   percent compared to the last successful run, treat it as suspicious: do not
   commit, log it, end. (Full Slate UI changes usually look like "everything
   disappeared", not "a few things changed".)
7. `git add public/availability.json && git commit -m "availability HH:MM" && git push`
8. Close the tab you opened. Report one line: slot count, days, source used.

## Never

- Never click Book, Cancel, Edit, Reschedule, Delete, Confirm, or Save inside Full Slate.
- Never type into any Full Slate field except a date navigation control if one is required to move between days.
- Never touch any file other than public/availability.json and logs/.
- Never force push. If push is rejected, `git pull --rebase` once, then push once, then stop.

## If the page looks different than expected

Do not guess. Log a screenshot description to logs/, do not commit, and end.
The owner would rather have 3 hour old data than wrong data.
````

### Add to the repo

- `logs/.gitkeep` and add `logs/*.md` to .gitignore (logs stay local, they are for debugging on the Mac)
- Update README.md with "how to run the sync by hand": open Claude Code in this folder and say
  `/sync-availability`

### Phase 2 verification

Run `/sync-availability` by hand at least 5 times across two different days. Each run should:

- Produce JSON that matches what the owner sees in Full Slate when she checks manually
- Pass validate
- Push a single-file commit
- Leave her existing Chrome tabs alone

On the first run, have her book a fake appointment in Full Slate, run the sync again, and confirm
that slot disappears from the JSON. Then cancel the fake booking and confirm it comes back.

If vision fallback triggers more than once in five runs, the source page or reading approach needs
changing before Phase 3. Fix it here.

## Phase 3: Schedule it

Goal: hands off.

### Mac prep (owner does this once)

- System Settings > Displays > Advanced > "Prevent automatic sleeping on power adapter when the
  display is off": ON. If it's a laptop, keep it plugged in and open, or set it to not sleep on lid
  close via a tool like Amphetamine
- Chrome stays open with the Claude in Chrome extension installed and signed in
- Full Slate stays logged in. If the session expires, the sync will log a failure and skip, the site
  keeps the last good data
- Claude desktop app stays open
- `gh auth login` completed in Terminal once so git push works without a password prompt

### Create the scheduled task

In Claude desktop or Claude Code, ask Claude to create a scheduled task with:

- Name: Sync availability
- Schedule: hourly, 7 AM to 9 PM Central, every day. Cron: `CRON_TZ=America/Chicago 7 7-21 * * *`
  (minute 7 to avoid top-of-hour traffic)
- Prompt (standalone, the task has no memory of this chat):
  > Open the project at <ABSOLUTE PATH TO availability-site>. Run the sync-availability skill
  > exactly as written in .claude/skills/sync-availability/SKILL.md. Full Slate is read only. If
  > validation fails or anything looks unexpected, do not commit, write a log, and stop. Report one
  > line at the end.
- Requires this computer: YES
- Approval: automatic, otherwise it stalls waiting for a click
- Folder access: the availability-site folder

### Phase 3 verification

- Watch the first 3 scheduled runs happen (check git log and the repo's Actions tab for Pages deploys)
- Leave it for two full days before sharing the URL with clients
- Spot check twice a day: open the site, open Full Slate, compare

## Known limitations, tell the owner these plainly

- Up to an hour stale. The page says so. Her text reply is the real confirmation, not the page.
- Two people can text for the same slot. First reply wins, she offers the other person alternatives.
- If the Mac sleeps, Chrome closes, or Full Slate logs out, updates stop. The stale banner appears
  after 2 hours and the site keeps showing the last good data.
- If Full Slate redesigns its booking page, the sync will start skipping runs. The fix is editing
  SKILL.md, not the website.
- Public phone number means some spam texts. A Google Voice number is cheap insurance if that
  becomes annoying.

## Later, only if she wants it

- Second scheduled task that texts or emails her when the sync has skipped 3 runs in a row
- A "notify me when something opens" form (would need a backend, skip for now)
- Custom domain on GitHub Pages
