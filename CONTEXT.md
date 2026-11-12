# Project context

Business facts and decisions for the FIT availability site. PLAN.md is the original build plan;
this file records what we've learned and decided since. Keep it current (see CLAUDE.md).

## Business

- **Name:** Fitness Institute of Texas (FIT), UT Austin. Website: https://sites.edb.utexas.edu/fit/
- **Texting number:** 512-703-0780 (`+15127030780`). Used everywhere on this site. Staff confirm by
  text and book by hand in Full Slate.
- **Calling number:** 512-471-0081. This is the number on the FIT website. Not shown on this site.
- **Sign-off on the site:** "Hook 'em! — Rachel"
- **Timezone:** America/Chicago
- **Full Slate:** staff schedule at https://app.fullslate.com/schedule (logged in on the owner's Mac).
  No public Full Slate booking link was found on the FIT website (checked 2026-11-08), and the sync
  doesn't use one: it reads this staff schedule only.

## Services

**Same thing, different names:** DXA = Body Comp FIT. VO₂ / VO₂ max = Aerobic FIT. Calorie FIT = RMR.
Bone Density FIT is a separate service (it also uses the DXA scanner).

Names as shown on the site. Confirm Full Slate's exact spelling during the discovery run.

| Service | Length | Prep shown to clients |
| --- | --- | --- |
| Body Comp + Aerobic FIT | 2 hours | Combination, not a Full Slate service (see Booking rules). No eating or caffeine 4 hours before. No vigorous exercise the day before. |
| Body Comp + Aerobic FIT with Lactate | 2½ hours | Combination, not a Full Slate service. DXA first. No vigorous exercise 24 hours before; no food or caffeine 4 hours before; exercise clothes. |
| Body Comp + Lactate FIT | 90 min | Combination, not a Full Slate service. DXA first. Same prep as Lactate FIT. |
| Aerobic FIT | 90 min | VO₂ max test. No eating or caffeine 4 hours before. No vigorous exercise the day before. |
| Body Comp FIT | 60 min | DXA scan. No eating or exercise 3 hours before. |
| Bone Density FIT | 30 min | Can be added to a Total Body DXA for 5 extra minutes. No set slots; clients text any 30-minute time. |
| Muscle FIT | 2½ hours | No vigorous exercise the day before. |
| Aerobic FIT with Lactate | 2 hours | No vigorous exercise for 24 hours before. No food or caffeine 4 hours before. Wear or bring exercise clothes. |
| Lactate FIT | 60 min | No vigorous exercise for 24 hours before. No food or caffeine 4 hours before. Wear or bring exercise clothes. |
| RMR + Body Comp FIT | 2 hours | Combination, not a Full Slate service. Starts 7:30–9 AM. Same prep as RMR. |
| RMR | 90 min | Starts 7:30–9 AM. Fast overnight (water is fine). No vigorous exercise for 12 hours before; light activity that morning. |

Lactate FIT (its name in Full Slate too) is the "lactate threshold only" test ($85) on
https://sites.edb.utexas.edu/fit/aerobic-fit-with-lactate/. That page also offers VO₂ max plus
lactate ("Aerobic FIT with Lactate", 2 hours, $150), which is booked as its own service.

Full Slate service names confirmed so far: Body Comp FIT (the DXA scan, once labeled "DXA only"),
Aerobic FIT (the VO₂ max test, once labeled "VO₂ only"), Lactate FIT, Aerobic FIT with Lactate.
Unconfirmed: the Full Slate names for Bone Density FIT, Muscle FIT and RMR.

**Every service name in Full Slate starts with 🤘** (Hook 'em). When matching, ignore it and any spacing after it: "🤘 Body Comp FIT" in
Full Slate is "Body Comp FIT" on the site.

RMR is called "Calorie FIT (RMR)" on the FIT website (details from
https://sites.edb.utexas.edu/fit/calorie-fit/). It uses a Parvo Medics TrueOne 2400 metabolic
cart (see Equipment).

## Booking rules

The sync applies these when working out openings from the staff schedule.

- **Combined bookings are 30 minutes shorter than the sum.** When a client books more than one
  assessment together, the total appointment is shortened by 30 minutes. Examples:
  Body Comp FIT (60) + Aerobic FIT (90) = 2 hours; Aerobic FIT (90) + Lactate FIT (60) = 2 hours,
  which is the "Aerobic FIT with Lactate" service.
- **Body Comp (DXA) always comes first** when combined with Aerobic FIT or Aerobic FIT with Lactate.
- **Body Comp + Aerobic FIT** (once labeled "DXA + VO₂") is not a Full Slate service. In Full Slate
  it's Body Comp FIT then Aerobic FIT.
- **Body Comp + Aerobic FIT with Lactate** (2½ hours: 60 + 120 − 30) and **Body Comp + Lactate FIT**
  (90 min: 60 + 60 − 30) are combinations too, DXA first.
- **Staffing for Body Comp + an aerobic test** (Aerobic FIT, Aerobic FIT with Lactate, Lactate FIT):
  - Preferred: one person does both parts, start to finish.
  - Allowed fallback: Rachel Watson does the DXA, then Xavier Cantu or Sammy Reyes does the aerobic
    part. Rachel uses this when Xavier and Sammy are busy at the start time.
  - So an opening exists if one qualified person is free for the whole block, OR Rachel is free for
    the DXA part and Xavier or Sammy is free for the aerobic part (plus the metabolic cart).
  - The DXA part takes 30–45 minutes, then the handoff. To be safe, the split option needs Rachel
    free for the first 45 minutes and Xavier or Sammy free from 30 minutes in until the end.
- **RMR + Body Comp FIT** is a 2-hour combination (90 + 60 − 30), not a Full Slate service. Rachel
  Watson does all of it. RMR first, then DXA.
- **RMR is Rachel Watson only.** No one else performs RMR, so RMR and RMR + Body Comp FIT openings
  require Rachel to be free for the whole appointment.

- **RMR start times:** 7:30 AM to 9:00 AM only. A 9:30 AM start is sometimes possible, depending
  on the client's wake-up time. The site doesn't list it; clients can text to ask.

## Equipment

- **Metabolic cart: only one.** RMR, Aerobic FIT (also the Aerobic part of
  Body Comp + Aerobic FIT), Lactate FIT and Aerobic FIT with Lactate all use it, so no two of them can overlap. One opening for each means the cart
  is free for that service's whole length, not just that a qualified staff member is free.
- **DXA scanner: only one.** Used by Body Comp FIT, Bone Density FIT and every combination with
  Body Comp. Up to two DXA appointments may run at once, including starting at the same time:
  the scan is 8–12 minutes, so one client talks with staff for 7–10 minutes while the other is
  scanned (and clients often arrive 5–10 minutes early or late anyway). Never three at once: if
  two of Rachel, Xavier and Sammy already have a DXA appointment overlapping a time, the third
  can't be offered one then.
- **Only Rachel, Xavier and Sammy use either machine.** Other staff never block the equipment.

## Staff

**Only Rachel Watson, Xavier Cantu and Sammy Reyes are booked through this site.** Openings are
worked out for these three only. The other seven don't use the metabolic cart or the DXA scanner,
so the sync ignores their appointments entirely.

Names exactly as they appear in Full Slate's Staff list, with their calendar color (from a
screenshot of the schedule sidebar, 2026-11-08). The services each person can perform are still
to be filled in.

| Staff member | Full Slate color | Services they can perform | Notes (days, hours, limits) |
| --- | --- | --- | --- |
| Rachel Watson | pink / lilac | RMR (only she does it), RMR + Body Comp FIT, Body Comp FIT, Bone Density FIT, Muscle FIT | Owner; signs off the site; the person working with Claude on this project. Not Aerobic FIT, so not Body Comp + Aerobic FIT unless the parts can be split between staff (unconfirmed) |
| Xavier Cantu | purple | Everything except RMR (all single services and combinations) | Takes over the aerobic part of a combo after Rachel's DXA |
| Angeles Villarreal | teal | Not booked by text | |
| Brittany Crim | blue | Not booked by text | Same-looking blue as Jacob Soriano |
| Jenna Schmitz | beige | Not booked by text | |
| Lidia Gutierrez | gray | Not booked by text | |
| Sammy Reyes | green | Everything except RMR (all single services and combinations) | Takes over the aerobic part of a combo after Rachel's DXA |
| Ellen Tally | red / salmon | Not booked by text | |
| Brittney Fernandez | orange | Not booked by text | Spelled "Brittney", unlike Brittany Crim |
| Jacob Soriano | blue | Not booked by text | Same-looking blue as Brittany Crim |

Reading tip for the sync: identify staff by name in the page text, not by color. Brittany Crim and
Jacob Soriano share a near-identical blue, and the two first names are spelled differently.

## Decisions log

Newest first. One line each: date, decision, why.

- **2026-11-11:** The sync reads only the logged-in staff schedule through Claude in Chrome and works
  out openings from Rachel's, Xavier's and Sammy's appointments using the rules in this file. No
  public booking page. Source labels are now `dashboard_calendar` and `dashboard_calendar_vision`.
  Why: owner's decision; no public Full Slate booking link exists.
- **2026-11-08:** At most two DXA appointments at once (one scanner); other staff ignored entirely.
  Why: owner's rule; only Rachel, Xavier and Sammy use the equipment.
- **2026-11-08:** Openings only for Rachel Watson, Xavier Cantu and Sammy Reyes. ~~Other staff's
  appointments still block shared equipment.~~ (Replaced the same day by the entry above: other
  staff are ignored entirely.) Why: only these three are booked by text.
- **2026-11-08:** Filter buttons split into Single and Combined groups; added "Body Comp + Lactate FIT" (90 min).
  Why: 12 buttons were too many to scan in one list.
- **2026-11-08:** Added "Body Comp + Aerobic FIT with Lactate" (2½ hours) to the site. Why: offered, DXA first.
- **2026-11-08:** Added "RMR + Body Comp FIT" (2 hours, 7:30–9 AM starts) to the site. Why: offered together, all by Rachel.
- **2026-11-08:** Site shows 🤘 before service names (filters, details card, time buttons); texts and
  availability.json stay plain. Why: owner's request, matches Full Slate's 🤘 prefix.
- **2026-11-08:** The sync ignores the longhorn prefix on Full Slate service names when matching.
  Why: every name has it; the site labels don't.
- **2026-11-08:** Renamed "DXA only" to "Body Comp FIT" and "DXA + VO₂" to "Body Comp + Aerobic FIT"; prep lines
  mention DXA and VO₂ so clients still recognize them. Why: match Full Slate names.
- **2026-11-08:** Renamed "VO₂ only" to "Aerobic FIT" on the site. Why: same service; matches Full Slate.
- **2026-11-08:** Added "Aerobic FIT with Lactate" (2 hours) as a service. Why: booked separately in Full Slate.
- **2026-11-08:** Added "Lactate FIT" (60 min) as a service, named to match Full Slate. Why: clients can book lactate threshold without VO₂.
- **2026-11-08:** Openings for RMR, VO₂ and lactate tests require the one metabolic cart to be free.
  Why: there's only one cart.
- **2026-11-08:** RMR shows only 7:30–9:00 AM starts; 9:30 is by request. Why: owner's rule.
- **2026-11-08:** Added RMR as a sixth service, labeled "RMR" on the site. Why: Rachel performs it; it was missing.
- **2026-11-08:** Openings come from the Full Slate staff schedule, not a public booking page.
  Why: owner's instruction; staff availability always comes from Full Slate.
- **2026-11-08:** The sync's first run is a read-only discovery run. Why: the staff schedule shows
  booked appointments, not open start times, and inferring gaps risks showing times that aren't open.
  (Since 2026-11-11 discovery records how to read the staff schedule, not a booking page.)
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
