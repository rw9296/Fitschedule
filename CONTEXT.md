# Project context

Business facts and decisions for the FIT availability site. PLAN.md is the original build plan;
this file records what we've learned and decided since. Keep it current (see CLAUDE.md).

## Business

- **Name:** Fitness Institute of Texas (FIT), UT Austin. Website: https://sites.edb.utexas.edu/fit/
- **Booking:** clients text 512-703-0780 (`+15127030780`). Staff confirm by text and book by hand in Full Slate.
- **Sign-off on the site:** "Hook 'em! — Rachel"
- **Timezone:** America/Chicago
- **Full Slate:** staff schedule at https://app.fullslate.com/schedule (logged in on the owner's Mac).
  No public Full Slate booking link was found on the FIT website (checked 2026-11-08).

## Services

Names as shown on the site. Confirm Full Slate's exact spelling during the discovery run.

| Service | Length | Prep shown to clients |
| --- | --- | --- |
| DXA + VO₂ | 2 hours | No eating or caffeine 4 hours before. No vigorous exercise the day before. |
| VO₂ only | 90 min | No eating or caffeine 4 hours before. No vigorous exercise the day before. |
| DXA only | 60 min | No eating or exercise 3 hours before. |
| Bone Density FIT | 30 min | Can be added to a Total Body DXA for 5 extra minutes. No set slots; clients text any 30-minute time. |
| Muscle FIT | 2½ hours | No vigorous exercise the day before. |
| RMR | 90 min | Early morning only. Fast overnight (water is fine). No vigorous exercise for 12 hours before; light activity that morning. |

RMR is called "Calorie FIT (RMR)" on the FIT website (details from
https://sites.edb.utexas.edu/fit/calorie-fit/). It uses a Parvo Medics TrueOne 2400 metabolic
cart. Unconfirmed: whether that's the same cart as VO₂ testing, which would mean RMR and VO₂
can't run at the same time.

## Staff

Names exactly as they appear in Full Slate's Staff list, with their calendar color (from a
screenshot of the schedule sidebar, 2026-11-08). The services each person can perform are still
to be filled in.

| Staff member | Full Slate color | Services they can perform | Notes (days, hours, limits) |
| --- | --- | --- | --- |
| Rachel Watson | pink / lilac | RMR, DXA only, Bone Density FIT, Muscle FIT | Owner; signs off the site. Not VO₂, so not DXA + VO₂ unless the combo can be split between staff (unconfirmed) |
| Xavier Cantu | purple | TBD | |
| Angeles Villarreal | teal | TBD | |
| Brittany Crim | blue | TBD | Same-looking blue as Jacob Soriano |
| Jenna Schmitz | beige | TBD | |
| Lidia Gutierrez | gray | TBD | |
| Sammy Reyes | green | TBD | |
| Ellen Tally | red / salmon | TBD | |
| Brittney Fernandez | orange | TBD | Spelled "Brittney", unlike Brittany Crim |
| Jacob Soriano | blue | TBD | Same-looking blue as Brittany Crim |

Reading tip for the sync: identify staff by name in the page text, not by color. Brittany Crim and
Jacob Soriano share a near-identical blue, and the two first names are spelled differently.

## Decisions log

Newest first. One line each: date, decision, why.

- **2026-11-08:** Added RMR as a sixth service, labeled "RMR" on the site. Why: Rachel performs it; it was missing.
- **2026-11-08:** Openings come from the Full Slate staff schedule, not a public booking page.
  Why: owner's instruction; staff availability always comes from Full Slate.
- **2026-11-08:** The sync's first run is a read-only discovery run. Why: the staff schedule shows
  booked appointments, not open start times, and inferring gaps risks showing times that aren't open.
- **2026-11-08:** Slots are written by `scripts/write-availability.js`, which also blocks a >60% drop.
  Why: the model never hand-writes timestamps or ordering.
- **2026-11-08:** Different services may share a start time (unique key is date + time + service).
  Why: FIT runs DXA and Muscle FIT in parallel.
- **2026-11-08:** Self-hosted fonts (Barlow Condensed, Source Sans 3, SIL OFL) in `public/fonts/`.
  Why: match the FIT look while keeping "no external requests".
- **2026-11-08:** Design follows the FIT "This week's openings" artifact: burnt orange, condensed
  uppercase headings, service filter chips, prep notes per service.
- **2026-11-08:** Tapping the phone number opens a text (`sms:`), never a call.
- **2026-11-08:** Hosting moved from Railway to GitHub Pages (free). Repo made public.
  Site: https://rw9296.github.io/Fitschedule/
- **2026-11-08:** Cloud sessions use the personal "fitschedule" environment, which allows
  `rw9296.github.io` and `sites.edb.utexas.edu`.
