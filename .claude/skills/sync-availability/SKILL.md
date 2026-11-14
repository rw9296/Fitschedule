---
name: sync-availability
description: Read the Full Slate staff schedule in Chrome, work out open times for Rachel, Xavier and Sammy, and update public/availability.json, validate, commit and push. Read only against Full Slate.
---

# Sync availability from Full Slate

Full Slate is READ ONLY. You are reading a calendar, not using it.

## Config

- SCHEDULE_URL: https://app.fullslate.com/schedule (the logged-in staff schedule, in the owner's
  Chrome). This is the only source. There is no public booking page.
- READING_NOTES: `done` (filled in from the 2026-11-11 discovery run)
- SERVICES_TO_SHOW (names on the site; Full Slate may spell them differently, e.g. "VO2"):
  Body Comp + Aerobic FIT (a combination, not a Full Slate service: see CONTEXT.md) ·
  Body Comp + Aerobic FIT with Lactate (combination) · Body Comp + Lactate FIT (combination) · Aerobic FIT · Body Comp FIT · Bone Density FIT · Muscle FIT · Aerobic FIT with Lactate · Lactate FIT · RMR + Body Comp FIT (combination) · RMR (may appear as "Calorie FIT")
- DAYS_AHEAD: 7 · TIMEZONE: America/Chicago
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

0. In the repo folder, run `git pull --ff-only` so you start from the latest commit. If it
   fails, log it and end.
1. Use Claude in Chrome. Open a NEW tab for SCHEDULE_URL. Do not reuse or disturb the owner's
   existing tabs.
2. For each **weekday (Mon–Fri)** from today through today + DAYS_AHEAD, read Rachel's, Xavier's
   and Sammy's working hours and busy blocks with `read-day.js`, as described in "Reading the
   schedule" below. Check each result's `date` is the day you expected (if the arrow click
   missed, the date repeats: find the arrow again and retry). Append each result, exactly as
   returned, as one line to a scratch file outside the repo: `$TMPDIR/fitsync-days.jsonl`
   (start it empty each run). Results with `problems` go in too; the calculator skips them.
   The source label is `dashboard_calendar`. Use `dashboard_calendar_vision` only if you had to
   read a day from a screenshot instead (avoid it: screenshots can't tell staff columns apart
   reliably).
3. Work out the openings with the calculator. Never work them out by hand:
   `node scripts/compute-openings.js $TMPDIR/fitsync-days.jsonl > $TMPDIR/slots.json`
   It applies CONTEXT.md's rules (hours, staff skills, the Rachel → Xavier/Sammy split, one
   metabolic cart, at most two DXA at once, RMR 7:30–9:00, no Bone Density times, weekdays only,
   no times already past). Its notes go to stderr: report any skipped days, and any
   `UNKNOWN service names` so they can be added to CONTEXT.md and the calculator's `EQUIP`.
   If it exits non-zero, log it and end.
4. If every weekday was skipped (all had problems), do not continue: log it and end.
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

From the 2026-11-11 discovery run. Plain page text is NOT enough: `get_page_text` returns almost
nothing, and appointment text never names the staff member (staff are only columns headed by
initials). So read the page structure with the read-only script `read-day.js` in this folder.

- **View:** Day view (the "Day" button). It shows every staff member as a column for one day.
  Leave the sidebar staff checkboxes alone: they change the owner's saved view.
- **Read a day:** paste the full contents of `.claude/skills/sync-availability/read-day.js` into
  Claude in Chrome's `javascript_tool`. It only reads the page. It returns:
  ```
  { date: "Nov 11",
    staff: { Rachel: { hours: "08:00-17:00", busy: ["07:30-08:30 Longhorn Body Comp FIT",
                                                    "11:00-12:30 (personal)", ...] },
             Xavier: {...}, Sammy: {...} },
    problems: [] }
  ```
  `hours` is unshaded (working) time, comma-separated if split; `""` means off all day.
  `busy` lists every booking and personal event in 24h time, with Full Slate's service text.
- **If `problems` is not empty, do not use that day.** Wait 3 seconds and run it again once; if
  there are still problems, leave the day out and put the problems in the log. In particular,
  "has not finished loading" means the grid looked empty: never treat that as a free day.
- **Wait for each day to load** (about 2 seconds) after moving before running the script.
- **Move between days:** the right arrow just after the date heading (e.g. "Nov 11") goes forward
  one day. The URL doesn't change. Today + 14 is reachable. "Today" goes back to today.
- **How the script finds staff:** the column under the header (initials `r`/`x`/`s` in a narrow
  window, full names like "Rachel Watson" in a wide one; either works) and each entry's color class (`schedule-da70d6` Rachel, `schedule-5644ac` Xavier,
  `schedule-69ab2b` Sammy). The two must agree, or it reports a problem. If staff are added,
  renamed or recolored in Full Slate, update `STAFF` at the top of the script (a human change,
  not the hourly task).
- **Service text:** 🤘 shows as the word "Longhorn" (e.g. "Longhorn Body Comp FIT"). Several
  services in one booking are comma-separated. Match them with CONTEXT.md's table.
- **Ignore** everything outside the three columns, the cookie banner, and the help chat popup.
  Skip Saturdays and Sundays entirely (click past them without reading): the site offers
  weekdays only, even though Rachel's column has some weekend hours, and `npm run validate`
  rejects weekend dates.

## Never

- Never click Book, Cancel, Edit, Reschedule, Delete, Confirm, or Save inside Full Slate.
- Never type into any Full Slate field except a date navigation control if one is required to
  move between days.
- Never run JavaScript in Full Slate other than `read-day.js` as written. Never click through
  JavaScript, and never change the page.
- Never touch any file other than public/availability.json and logs/.
- Never force push. If push is rejected, `git pull --rebase` once, then push once, then stop.

## If the page looks different than expected

Do not guess. Log a description of what you saw to logs/, do not commit, and end.
The owner would rather have 3 hour old data than wrong data.
