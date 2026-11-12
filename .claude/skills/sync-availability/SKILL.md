---
name: sync-availability
description: Read the Full Slate staff schedule in Chrome, work out open times for Rachel, Xavier and Sammy, and update public/availability.json, validate, commit and push. Read only against Full Slate.
---

# Sync availability from Full Slate

Full Slate is READ ONLY. You are reading a calendar, not using it.

## Config

- SCHEDULE_URL: https://app.fullslate.com/schedule (the logged-in staff schedule, in the owner's
  Chrome). This is the only source. There is no public booking page.
- READING_NOTES: `TBD` (set to `done` once "Reading the schedule" below is filled in after the
  discovery run)
- SERVICES_TO_SHOW (names on the site; Full Slate may spell them differently, e.g. "VO2"):
  Body Comp + Aerobic FIT (a combination, not a Full Slate service: see CONTEXT.md) ·
  Body Comp + Aerobic FIT with Lactate (combination) · Body Comp + Lactate FIT (combination) · Aerobic FIT · Body Comp FIT · Bone Density FIT · Muscle FIT · Aerobic FIT with Lactate · Lactate FIT · RMR + Body Comp FIT (combination) · RMR (may appear as "Calorie FIT")
- DAYS_AHEAD: 14 · TIMEZONE: America/Chicago
- Full Slate service names all start with 🤘. Ignore it when matching names, and
  never put it in availability.json.
- Only Rachel Watson, Xavier Cantu and Sammy Reyes are booked by text, and only they use the
  metabolic cart and DXA scanner. Read only their appointments; ignore all other staff entirely.
- Business rules: read CONTEXT.md first. Its Services, Staff, Booking rules and Equipment sections
  say how long each service is, who can perform it, allowed start times, and shared equipment.
  A time is open only if every one of those rules is met.

## Mode

- If READING_NOTES above is still `TBD`, do a **discovery run** (below) and stop.
  Do not write availability.json, do not commit.
- Otherwise do a **sync run**.

## Discovery run (first time only)

Goal: learn how the staff schedule reads as text, so sync runs can read it the same way every time.

1. Use Claude in Chrome. Open a NEW tab. Do not reuse or disturb the owner's tabs.
2. Open SCHEDULE_URL. Read it with get_page_text / read_page first; screenshot only if the text
   is empty or clearly incomplete. Only read. Never click Save, toggle settings or submit anything.
3. Work out and note:
   - Which views exist (day, week, by staff) and which one shows Rachel, Xavier and Sammy most
     completely as text.
   - How to show only those three staff, if there is a staff filter (read-only view controls only).
   - How each staff member's working hours appear (shaded vs unshaded, "off" blocks, time off).
   - What a booked appointment looks like in the text: staff name, start, end, service name.
   - The exact Full Slate spelling of every service in SERVICES_TO_SHOW that appears.
   - How to move between days or weeks, and whether 14 days ahead is reachable.
4. Write `logs/discovery-YYYY-MM-DD-HHMM.md` with all of the above and a short sample of the page
   text for one day. Close your tab.
5. Report what you found. A human then fills in "Reading the schedule" below, sets READING_NOTES
   to `done`, and commits that change. (The hourly task never edits this file.)

## Sync run

1. Use Claude in Chrome. Open a NEW tab for SCHEDULE_URL. Do not reuse or disturb the owner's
   existing tabs.
2. For each day from today through today + DAYS_AHEAD, read, for Rachel, Xavier and Sammy only:
   - their working hours that day (no hours = not working)
   - every appointment: staff, start, end, service (🤘 removed)
   Read with get_page_text or read_page FIRST. Take a screenshot only if the text read is empty
   or clearly incomplete. The source label is `dashboard_calendar`, or
   `dashboard_calendar_vision` if you needed screenshots for any day.
3. Work out openings from what you read, using CONTEXT.md:
   - Candidate start times are on the hour and half hour, inside the staff member's working hours,
     with the whole service ending by the end of those hours. Skip times already past today.
   - The staff member (or the allowed Rachel → Xavier/Sammy split for Body Comp + an aerobic
     test) must be free for the service's whole length.
   - Metabolic cart: no overlap with any other cart service by the three staff.
   - DXA scanner: no more than two DXA appointments overlapping at any moment.
   - RMR and RMR + Body Comp FIT: Rachel only, starts 7:30–9:00 AM only.
   - Bone Density FIT: list it only where Body Comp FIT would also be open.
   If a day's read was incomplete or ambiguous, leave that day out rather than guess.
4. Write the openings to a scratch file outside the repo (e.g. `$TMPDIR/slots.json`) as a
   flat JSON array, using the site's service names from SERVICES_TO_SHOW:
   `[{"date":"2026-11-10","time":"13:30","service":"Body Comp FIT"}, ...]`
   Dates YYYY-MM-DD, times 24h HH:MM, local Central time exactly as Full Slate shows them.
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

## Reading the schedule

(Filled in after the discovery run: which view to use, how to filter to Rachel, Xavier and Sammy,
how working hours and appointments appear in the page text, how to move between days, and
anything to ignore.)

## Never

- Never click Book, Cancel, Edit, Reschedule, Delete, Confirm, or Save inside Full Slate.
- Never type into any Full Slate field except a date navigation control if one is required to
  move between days.
- Never touch any file other than public/availability.json and logs/.
- Never force push. If push is rejected, `git pull --rebase` once, then push once, then stop.

## If the page looks different than expected

Do not guess. Log a description of what you saw to logs/, do not commit, and end.
The owner would rather have 3 hour old data than wrong data.
