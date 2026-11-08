---
name: sync-availability
description: Read current openings from Full Slate in Chrome and update public/availability.json, validate, commit and push. Read only against Full Slate.
---

# Sync availability from Full Slate

Full Slate is READ ONLY. You are reading a calendar, not using it.

## Config

- PUBLIC_BOOKING_URL: `TBD` (fill in after the discovery run, e.g. https://SOMETHING.fullslate.com)
- DASHBOARD_URL: https://app.fullslate.com/schedule (logged in, in the owner's Chrome)
- SERVICES_TO_SHOW (names on the site; Full Slate may spell them differently, e.g. "VO2"):
  DXA + VO₂ · VO₂ only · DXA only · Bone Density FIT · Muscle FIT · Lactate only · RMR (may appear as "Calorie FIT")
- DAYS_AHEAD: 14 · TIMEZONE: America/Chicago
- Business rules: read CONTEXT.md first. Its Staff, Booking rules and Equipment sections say who
  can perform each service, allowed start times, and shared equipment (for example, only one
  metabolic cart). A time is open only if every one of those rules is met.

## Mode

- If PUBLIC_BOOKING_URL above is still `TBD`, do a **discovery run** (below) and stop.
  Do not write availability.json, do not commit.
- Otherwise do a **sync run**.

## Discovery run (first time only)

Goal: find the most reliable page to read openings from and record how it works.

1. Use Claude in Chrome. Open a NEW tab. Do not reuse or disturb the owner's tabs.
2. Open DASHBOARD_URL. Read it with get_page_text / read_page. Note what it shows:
   booked appointments, the open (unshaded) hours, which staff or resources there are.
3. Look for the client-facing booking page link. It's usually under the business's settings
   or "Online booking" area, shown as a URL ending in `.fullslate.com`. Only read pages.
   Never click Save, toggle settings or submit anything.
4. If you find it, open it in the same new tab and read it. For one service, step through
   to the time picker and note: are open start times listed as text? How do you move between
   days? Does it need any typing (it must not)?
5. Write `logs/discovery-YYYY-MM-DD-HHMM.md` with: the booking URL, the exact service names as
   Full Slate spells them, how to reach the time list for each service, how to move between
   days, and whether the text read was complete. Close your tab.
6. Report what you found and recommend the source. A human then fills in PUBLIC_BOOKING_URL and
   the "Reading the source" notes below, and commits that change. (The hourly task never edits
   this file.)

## Sync run

1. Use Claude in Chrome. Open a NEW tab for the source page. Do not reuse or disturb the
   owner's existing tabs.
2. Source: PUBLIC_BOOKING_URL. Fall back to DASHBOARD_URL only if the public page is down or
   missing a needed service, and only if "Reading the source" says how to read openings there.
3. For each service in SERVICES_TO_SHOW, read every day from today through today + DAYS_AHEAD.
   Read with get_page_text or read_page FIRST. Take a screenshot only if the text read is empty
   or clearly incomplete. The source label is `public_booking_page`, `public_booking_page_vision`
   (if you needed screenshots) or `dashboard_calendar`.
4. Write the slots you read to a scratch file outside the repo (e.g. `$TMPDIR/slots.json`) as a
   flat JSON array, using the site's service names from SERVICES_TO_SHOW:
   `[{"date":"2026-11-10","time":"13:30","service":"DXA only"}, ...]`
   Dates YYYY-MM-DD, times 24h HH:MM, local Central time exactly as Full Slate shows them.
   Include only times Full Slate actually lists as open. Never infer or fill in times.
5. Build the file: `node scripts/write-availability.js --source <label> $TMPDIR/slots.json`
   - Exit 2 means a suspicious drop (more than 60% fewer slots than last run). Do not commit.
     Log it and end. Full Slate UI changes usually look like "everything disappeared".
   - Never pass `--allow-drop`. Only a human uses that, after checking Full Slate.
6. Run `npm run validate`. If it fails, STOP. Run `git checkout public/availability.json` to put
   back the last good file, write the failure and what the page looked like to
   `logs/sync-YYYY-MM-DD-HHMM.md`, and end.
7. If `git diff --quiet public/availability.json` shows only `updated` changed, still commit.
   The fresh timestamp is what keeps the stale banner off.
8. `git add public/availability.json && git commit -m "availability HH:MM" && git push`
9. Close the tab you opened. Report one line: slot count, days, source used.

## Reading the source

(Filled in after the discovery run: how to reach each service's time list, how to move
between days, what an open time looks like in the page text, and anything to ignore.)

## Never

- Never click Book, Cancel, Edit, Reschedule, Delete, Confirm, or Save inside Full Slate.
- Never type into any Full Slate field except a date navigation control if one is required to
  move between days.
- Never touch any file other than public/availability.json and logs/.
- Never force push. If push is rejected, `git pull --rebase` once, then push once, then stop.

## If the page looks different than expected

Do not guess. Log a description of what you saw to logs/, do not commit, and end.
The owner would rather have 3 hour old data than wrong data.
