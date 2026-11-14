// READ ONLY. Paste into Claude in Chrome's javascript_tool while Full Slate's schedule is in
// Day view. It only reads the page: it never clicks, types or changes anything.
// Returns the shown day's working hours and busy blocks for Rachel, Xavier and Sammy.
//
// Staff are found two ways and must agree: the column under their header initials, and the
// entry's color class. Anything unexpected goes in `problems`; if that's not empty, don't use the
// day (log it instead).
(() => {
  // Headers show initials in a narrow window and full names in a wide one; accept either.
  const STAFF = {
    Rachel: { initials: 'r', full: 'Rachel Watson', color: 'da70d6' },
    Xavier: { initials: 'x', full: 'Xavier Cantu', color: '5644ac' },
    Sammy: { initials: 's', full: 'Sammy Reyes', color: '69ab2b' },
  };
  const problems = [];
  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  // Date shown, e.g. "Nov 12" (no year).
  const date = [...document.querySelectorAll('h1,h2,h3,h4')]
    .map((h) => h.textContent.trim())
    .find((s) => /^[A-Z][a-z]{2} \d{1,2}$/.test(s));
  if (!date) problems.push('no day heading found: is the schedule in Day view?');

  // Vertical scale from the hour rows: 22 labels, 1 AM..11 AM then 1 PM..11 PM (Noon is separate).
  const rows = [...document.querySelectorAll('.glut-schedule-hour')].map((e) => {
    const r = e.getBoundingClientRect();
    return r.top + r.height / 2;
  });
  if (rows.length !== 22) problems.push(`expected 22 hour rows, found ${rows.length}`);
  const pxPerHour = (rows[rows.length - 1] - rows[0]) / 22;
  const midnightY = rows[0] - pxPerHour;
  const yToMin = (y) => Math.round(((y - midnightY) / pxPerHour) * 4) * 15; // nearest 15 min
  if (!(pxPerHour > 20 && pxPerHour < 200)) problems.push(`odd hour height ${pxPerHour}px`);

  // An unloaded grid looks like "everyone free all day". Refuse it.
  if (document.querySelectorAll('.glut-unavailable').length === 0) {
    problems.push('no shaded hours on the page: the schedule has not finished loading');
  }

  // Columns from header initials.
  const headers = [...document.querySelectorAll('li')].filter((li) => {
    const t = li.textContent.trim();
    const r = li.getBoundingClientRect();
    return t.length > 0 && t.length <= 40 && r.width > 20 && r.width < 300;
  });
  const col = {};
  for (const [name, s] of Object.entries(STAFF)) {
    const matches = headers.filter((li) => [s.initials, s.full].includes(li.textContent.trim()));
    if (matches.length !== 1) { problems.push(`${name}: ${matches.length} header columns "${s.initials}"`); continue; }
    const r = matches[0].getBoundingClientRect();
    col[name] = [r.left, r.right];
  }
  const inCol = (r, name) => {
    const c = col[name];
    const cx = r.left + r.width / 2;
    return c && cx >= c[0] && cx < c[1];
  };

  // "7:30 AM", "10 AM", "12:30 PM", "Noon" -> minutes after midnight.
  const toMin = (s) => {
    s = s.trim();
    if (/^noon$/i.test(s)) return 12 * 60;
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!m) return null;
    let h = +m[1] % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + (+m[2] || 0);
  };
  const TIME = /^(.+?)\s*-\s*(.+)$/;

  const out = {};
  for (const [name, s] of Object.entries(STAFF)) {
    if (!col[name]) continue;

    // Working hours = the column minus its shaded .glut-unavailable blocks.
    const off = [...document.querySelectorAll('.glut-unavailable')]
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.height > 0 && inCol(r, name))
      .map((r) => [Math.max(0, yToMin(r.top)), Math.min(1440, yToMin(r.bottom))])
      .sort((a, b) => a[0] - b[0]);
    const hours = [];
    let t = 0;
    for (const [a, b] of off) {
      if (a > t) hours.push([t, a]);
      t = Math.max(t, b);
    }
    if (t < 1440) hours.push([t, 1440]);
    if (hours.some(([a, b]) => b - a > 16 * 60)) problems.push(`${name}: over 16 working hours in a row, check the read`);

    // Busy blocks: every entry with this staff's color class.
    const busy = [];
    for (const e of document.querySelectorAll(`.glut-schedule-entry[class*="schedule-${s.color}"]:not(.glut-unavailable)`)) {
      const lines = e.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
      const i = lines.findIndex((l) => {
        const m = l.match(TIME);
        return m && toMin(m[1]) !== null && toMin(m[2]) !== null;
      });
      if (i < 0) { problems.push(`${name}: entry without a readable time`); continue; }
      const m = lines[i].match(TIME);
      const start = toMin(m[1]);
      const end = toMin(m[2]);
      if (!inCol(e.getBoundingClientRect(), name)) problems.push(`${name}: ${lines[i]} entry is not in the "${s.initials}" column`);
      // Client bookings: name, services, time. Personal events: title, time.
      // services is the raw Full Slate text, comma-separated ("" for a personal event).
      const services = i >= 2 ? lines[i - 1] : '';
      busy.push({ start: hhmm(start), end: hhmm(end), services, personal: i < 2 });
    }
    busy.sort((a, b) => a.start.localeCompare(b.start));
    // Flat strings so the tool's output depth limit never truncates anything.
    out[name] = {
      hours: hours.map(([a, b]) => `${hhmm(a)}-${hhmm(b)}`).join(', '),
      busy: busy.map((x) => `${x.start}-${x.end} ${x.personal ? '(personal)' : x.services}`),
    };
  }

  // Entries sitting in one of the three columns but with a different color: staff mismatch.
  // (Shaded off-hours blocks are .glut-schedule-entry too, so skip .glut-unavailable.)
  for (const e of document.querySelectorAll('.glut-schedule-entry:not(.glut-unavailable)')) {
    const r = e.getBoundingClientRect();
    for (const [name, s] of Object.entries(STAFF)) {
      if (inCol(r, name) && !e.className.includes(`schedule-${s.color}`)) {
        problems.push(`entry in ${name}'s column has another color (${(e.className.match(/schedule-\w+/) || [''])[0]})`);
      }
    }
  }

  return { date, staff: out, problems };
})();
