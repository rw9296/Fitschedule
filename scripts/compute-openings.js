#!/usr/bin/env node
// Works out open start times from what read-day.js read off Full Slate, using the rules in
// CONTEXT.md (staff skills, working hours, one metabolic cart, at most two DXA at once, RMR
// start window, combinations). The sync uses this so the model never works out openings by hand.
//
// Usage:
//   node scripts/compute-openings.js days.jsonl > slots.json
//   node scripts/compute-openings.js --now 2026-11-14T07:57 days.jsonl   (fixed "now", for tests)
//
// Input: one read-day.js result per line, e.g.
//   {"date":"Nov 16","staff":{"Rachel":{"hours":"08:00-17:00","busy":["09:00-10:00 Longhorn Body Comp FIT", ...]}, ...},"problems":[]}
// Output (stdout): the flat slot array write-availability.js takes.
// Notes (stderr): skipped days and any service names not in EQUIP below.
//
// Keep EQUIP and SERVICES in step with CONTEXT.md.

'use strict';

const fs = require('fs');

const TIMEZONE = 'America/Chicago';
const DAYS_AHEAD = 7;
const STEP = 30; // candidate starts on the hour and half hour

// Full Slate service name (🤘/"Longhorn" prefix removed, lower case) -> machine it uses.
// Anything not listed counts as using BOTH machines (hide a time rather than offer a wrong one).
const EQUIP = {
  'body comp fit': 'dxa',
  'bone density fit': 'dxa',
  'student body comp fit': 'dxa',
  'getfit pre dxa': 'dxa',
  'getfit post dxa': 'dxa',
  'aerobic fit': 'cart',
  'aerobic fit with lactate': 'cart',
  'lactate fit': 'cart',
  'calorie fit': 'cart',
  'muscle fit': 'none',
  'gf aerobic': 'none',
  'health coach check in': 'none',
};

// Services offered on the site. parts: [from, to, machine] in minutes after the start.
// staff: who can do the whole thing. split: Rachel may do the DXA (first 45 min) and Xavier or
// Sammy the aerobic part (from 30 min to the end). starts: allowed start window [first, last].
// Bone Density FIT is never listed (clients text any 30-minute time).
const RXS = ['Rachel', 'Xavier', 'Sammy'];
const XS = ['Xavier', 'Sammy'];
const SERVICES = [
  { name: 'Body Comp FIT', len: 60, parts: [[0, 60, 'dxa']], staff: RXS },
  { name: 'Aerobic FIT', len: 90, parts: [[0, 90, 'cart']], staff: XS },
  { name: 'Aerobic FIT with Lactate', len: 120, parts: [[0, 120, 'cart']], staff: XS },
  { name: 'Lactate FIT', len: 60, parts: [[0, 60, 'cart']], staff: XS },
  { name: 'Muscle FIT', len: 150, parts: [], staff: RXS },
  { name: 'RMR', len: 90, parts: [[0, 90, 'cart']], staff: ['Rachel'], starts: [450, 540] },
  { name: 'RMR + Body Comp FIT', len: 120, parts: [[0, 90, 'cart'], [60, 120, 'dxa']], staff: ['Rachel'], starts: [450, 540] },
  { name: 'Body Comp + Aerobic FIT', len: 120, parts: [[0, 45, 'dxa'], [30, 120, 'cart']], staff: XS, split: true },
  { name: 'Body Comp + Aerobic FIT with Lactate', len: 150, parts: [[0, 45, 'dxa'], [30, 150, 'cart']], staff: XS, split: true },
  { name: 'Body Comp + Lactate FIT', len: 90, parts: [[0, 45, 'dxa'], [30, 90, 'cart']], staff: XS, split: true },
];

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hhmm = (x) => `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
const norm = (s) => s.trim().replace(/^🤘\s*/, '').replace(/^longhorn\s+/i, '').trim().toLowerCase();

function chicagoNow() {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

function computeOpenings(days, nowStr) {
  const [today, nowTime] = nowStr.split('T');
  const nowMin = toMin(nowTime);
  const [ty, tm] = today.split('-').map(Number);
  const dayMs = (iso) => Date.parse(`${iso}T00:00:00Z`);
  const lastMs = dayMs(today) + DAYS_AHEAD * 86400000;

  const slots = [];
  const notes = [];
  const unknown = new Set();

  for (const d of days) {
    const mt = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(d.date || '');
    if (!mt || !MONTHS[mt[1]]) { notes.push(`skip: unreadable date ${JSON.stringify(d.date)}`); continue; }
    const mon = MONTHS[mt[1]];
    const year = mon < tm ? ty + 1 : ty; // e.g. reading "Jan 2" in late December
    const date = `${year}-${pad(mon)}-${pad(+mt[2])}`;
    if ((d.problems || []).length) { notes.push(`skip ${date}: ${d.problems.join('; ')}`); continue; }
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) { notes.push(`skip ${date}: weekend`); continue; }
    if (dayMs(date) < dayMs(today) || dayMs(date) > lastMs) { notes.push(`skip ${date}: outside today..+${DAYS_AHEAD}`); continue; }

    const hours = {};
    const busy = {};
    const dxa = [];
    const cart = [];
    for (const [who, s] of Object.entries(d.staff || {})) {
      hours[who] = s.hours ? s.hours.split(', ').map((r) => r.split('-').map(toMin)) : [];
      busy[who] = [];
      for (const b of s.busy || []) {
        const m = /^(\d\d:\d\d)-(\d\d:\d\d) (.*)$/.exec(b);
        if (!m) { notes.push(`${date} ${who}: unreadable busy entry ${JSON.stringify(b)}`); return { slots: null, notes, unknown: [...unknown] }; }
        const a = toMin(m[1]);
        const z = toMin(m[2]);
        busy[who].push([a, z]);
        if (m[3] === '(personal)') continue;
        let useDxa = false;
        let useCart = false;
        for (const svc of m[3].split(',').map(norm).filter(Boolean)) {
          const e = EQUIP[svc];
          if (!e) { unknown.add(svc); useDxa = true; useCart = true; } else if (e === 'dxa') useDxa = true;
          else if (e === 'cart') useCart = true;
        }
        if (useDxa) dxa.push([a, z]);
        if (useCart) cart.push([a, z]);
      }
    }
    for (const who of RXS) if (!hours[who]) { notes.push(`skip ${date}: no reading for ${who}`); }
    if (RXS.some((w) => !hours[w])) continue;

    const overlaps = (a, z, list) => list.filter(([x, y]) => x < z && a < y).length;
    const working = (who, a, z) => hours[who].some(([x, y]) => x <= a && z <= y);
    const free = (who, a, z) => working(who, a, z) && overlaps(a, z, busy[who]) === 0;
    // At most two DXA at once including the new one: existing overlap must stay <= 1 throughout.
    const dxaOk = (a, z) => { for (let t = a; t < z; t += 5) if (overlaps(t, t + 5, dxa) > 1) return false; return true; };
    const cartOk = (a, z) => overlaps(a, z, cart) === 0;

    for (let t = 0; t < 1440; t += STEP) {
      if (date === today && t <= nowMin) continue;
      for (const S of SERVICES) {
        if (S.starts && (t < S.starts[0] || t > S.starts[1])) continue;
        const z = t + S.len;
        if (!S.parts.every(([o1, o2, e]) => (e === 'dxa' ? dxaOk(t + o1, t + o2) : cartOk(t + o1, t + o2)))) continue;
        let staffed = S.staff.some((w) => free(w, t, z));
        if (!staffed && S.split) staffed = free('Rachel', t, t + 45) && XS.some((w) => free(w, t + 30, z));
        if (staffed) slots.push({ date, time: hhmm(t), service: S.name });
      }
    }
  }
  return { slots, notes, unknown: [...unknown] };
}

module.exports = { computeOpenings, EQUIP, SERVICES };

if (require.main === module) {
  const args = process.argv.slice(2);
  const ni = args.indexOf('--now');
  const nowStr = ni >= 0 ? args[ni + 1] : chicagoNow();
  const file = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--now').pop();
  if (!file) { console.error('FAIL: give the read-day results file (one JSON per line)'); process.exit(1); }
  let days;
  try {
    days = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  } catch (e) {
    console.error(`FAIL: cannot read ${file}: ${e.message}`);
    process.exit(1);
  }
  const { slots, notes, unknown } = computeOpenings(days, nowStr);
  notes.forEach((n) => console.error(n));
  if (unknown.length) console.error(`UNKNOWN service names (counted as using both machines): ${unknown.join(', ')}`);
  if (!slots) process.exit(1);
  process.stdout.write(JSON.stringify(slots) + '\n');
  console.error(`OK: ${slots.length} openings`);
}
