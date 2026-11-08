# availability-site

Static page showing Full Slate openings so clients can text to book.
Read PLAN.md for the full design. Hard rules:

- Full Slate is READ ONLY. Never click Book, Cancel, Edit, Reschedule, Delete,
  or submit any form there. Never type into Full Slate fields.
- Never commit public/availability.json unless `npm run validate` passes.
- Times are local wall-clock in America/Chicago. Never convert timezones.
- public/index.html is a single file with no build step and no external requests
  (fonts are self-hosted in public/fonts/).
- Commits from the hourly task touch only public/availability.json.

Config lives at the top of PLAN.md under "Fill these in".

## Keep the docs current

Do this as part of any change, in the same commit, without being asked:

- **README.md:** update it when setup steps, commands, URLs, or how things run change.
- **CONTEXT.md:** record business facts (services, staff and what each can perform, hours,
  booking rules) when the owner shares them. Add a dated one-line entry to its Decisions log for
  any design or process decision, with the reason.
- **Exception:** the hourly sync task never edits docs. It only touches
  public/availability.json and logs/.
