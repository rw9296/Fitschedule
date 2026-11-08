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
