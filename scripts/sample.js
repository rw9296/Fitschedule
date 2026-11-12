#!/usr/bin/env node
// Phase 1 helper: writes fake sample data to public/availability.json with
// "updated" set to the current America/Chicago time, so the page and
// `npm run validate` can be tested. Not used once the real sync is running.
//
// Usage:
//   npm run sample                 fresh sample data
//   npm run sample -- --hours-ago 3   "updated" 3 hours ago (to test the stale banner)
//   npm run sample -- --empty         no slots (to test the empty state)

'use strict';

const fs = require('fs');
const path = require('path');

const TIMEZONE = 'America/Chicago';
const DAYS_AHEAD = 7;

const args = process.argv.slice(2);
const hoursAgoIdx = args.indexOf('--hours-ago');
const hoursAgo = hoursAgoIdx >= 0 ? Number(args[hoursAgoIdx + 1]) : 0;
const empty = args.includes('--empty');

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date());
const get = (t) => Number(parts.find((p) => p.type === t).value);
// Wall-clock "now" in TIMEZONE, carried in a UTC Date purely for arithmetic.
const now = new Date(Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')));

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const isoLocal = (d) => `${isoDate(d)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

const updated = new Date(now.getTime() - hoursAgo * 3600000);

// Fake pattern using the real FIT service names: a few slots on weekdays only.
const patterns = [
  [{ time: '08:30', service: 'Body Comp FIT' }, { time: '10:30', service: 'Body Comp + Aerobic FIT' }, { time: '13:30', service: 'Body Comp + Aerobic FIT' }, { time: '14:00', service: 'Aerobic FIT' }],
  [{ time: '11:00', service: 'Muscle FIT' }, { time: '11:00', service: 'Body Comp FIT' }, { time: '13:00', service: 'Aerobic FIT' }],
  [{ time: '09:30', service: 'Body Comp + Aerobic FIT' }, { time: '12:00', service: 'Body Comp FIT' }, { time: '14:30', service: 'Muscle FIT' }],
  [{ time: '07:30', service: 'RMR + Body Comp FIT' }, { time: '09:00', service: 'Body Comp + Lactate FIT' }, { time: '13:30', service: 'Aerobic FIT' }, { time: '15:00', service: 'Body Comp FIT' }],
];

const days = [];
if (!empty) {
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    days.push({ date: isoDate(d), slots: patterns[i % patterns.length] });
  }
}

const out = {
  updated: isoLocal(updated),
  timezone: TIMEZONE,
  days_ahead: DAYS_AHEAD,
  source: 'sample_data',
  days,
};

const file = path.join(__dirname, '..', 'public', 'availability.json');
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
const count = days.reduce((n, d) => n + d.slots.length, 0);
console.log(`Wrote ${count} sample slots across ${days.length} days, updated ${out.updated}`);
