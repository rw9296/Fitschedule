#!/usr/bin/env node
// Builds public/availability.json from a flat list of slots read off Full Slate.
// Does the mechanical parts so the sync never hand-writes them:
//   - stamps "updated" with the current America/Chicago wall-clock time
//   - groups by date, sorts by date then time then service, drops exact duplicates
//   - refuses (exit 2) if the slot count fell more than 60% vs the last committed file
//
// Usage:
//   node scripts/write-availability.js --source dashboard_calendar slots.json
//   ... | node scripts/write-availability.js --source dashboard_calendar -
//
// Input: a JSON array like
//   [{ "date": "2026-11-10", "time": "10:00", "service": "Body Comp FIT" }, ...]
// Dates are YYYY-MM-DD and times are 24h HH:MM, both local America/Chicago.
//
// Flags:
//   --source <name>   dashboard_calendar | dashboard_calendar_vision
//   --allow-drop      skip the 60% drop check (a human only, after checking Full Slate)
//   --dry-run         print the result instead of writing it
//
// Exit codes: 0 written, 1 bad input, 2 suspicious drop (nothing written).

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TIMEZONE = 'America/Chicago';
const DAYS_AHEAD = 14;
const MAX_DROP = 0.6;
const MIN_PREVIOUS_FOR_DROP_CHECK = 5;
const SOURCES = ['dashboard_calendar', 'dashboard_calendar_vision'];

const root = path.join(__dirname, '..');
const target = path.join(root, 'public', 'availability.json');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const source = opt('--source');
const input = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--source').pop();

function fail(code, msg) { console.error(`FAIL: ${msg}`); process.exit(code); }

if (!SOURCES.includes(source)) fail(1, `--source must be one of ${SOURCES.join(', ')}`);
if (!input) fail(1, 'give the slots file path, or - for stdin');

let slots;
try {
  slots = JSON.parse(fs.readFileSync(input === '-' ? 0 : input, 'utf8'));
} catch (e) {
  fail(1, `cannot read slots JSON: ${e.message}`);
}
if (!Array.isArray(slots)) fail(1, 'input must be a JSON array of {date, time, service}');

// Normalize and check each slot's shape (full rules are enforced by validate.js after).
const clean = [];
const seen = new Set();
for (const [i, s] of slots.entries()) {
  if (!s || typeof s !== 'object') fail(1, `slot ${i} is not an object`);
  const date = String(s.date || '').trim();
  let time = String(s.time || '').trim();
  if (/^\d:\d{2}$/.test(time)) time = '0' + time;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(1, `slot ${i}: date must be YYYY-MM-DD (got ${JSON.stringify(s.date)})`);
  if (!/^\d{2}:\d{2}$/.test(time)) fail(1, `slot ${i}: time must be 24h HH:MM (got ${JSON.stringify(s.time)})`);
  const service = s.service == null ? '' : String(s.service).trim();
  const key = `${date} ${time} ${service}`;
  if (seen.has(key)) continue;
  seen.add(key);
  clean.push(service ? { date, time, service } : { date, time });
}

clean.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || (a.service || '').localeCompare(b.service || ''));

const days = [];
for (const s of clean) {
  let day = days[days.length - 1];
  if (!day || day.date !== s.date) { day = { date: s.date, slots: [] }; days.push(day); }
  day.slots.push(s.service ? { time: s.time, service: s.service } : { time: s.time });
}

// Current wall-clock time in TIMEZONE, no Z.
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(new Date());
const g = (t) => parts.find((p) => p.type === t).value;
const updated = `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;

const out = { updated, timezone: TIMEZONE, days_ahead: DAYS_AHEAD, source, days };

// Compare with the last committed (= last successful) file.
let prevCount = null;
try {
  const prev = JSON.parse(execSync('git show HEAD:public/availability.json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  if (prev.source !== 'sample_data') {
    prevCount = (prev.days || []).reduce((n, d) => n + (d.slots || []).length, 0);
  }
} catch (_) { /* no previous file */ }

const count = clean.length;
if (!flag('--allow-drop') && prevCount !== null && prevCount >= MIN_PREVIOUS_FOR_DROP_CHECK && count < prevCount * (1 - MAX_DROP)) {
  fail(2, `suspicious drop: ${count} slots now vs ${prevCount} last run (more than ${MAX_DROP * 100}% fewer). Not written.`);
}

const json = JSON.stringify(out, null, 2) + '\n';
if (flag('--dry-run')) {
  process.stdout.write(json);
} else {
  fs.writeFileSync(target, json);
  console.log(`Wrote ${count} slots across ${days.length} days, updated ${updated}` + (prevCount !== null ? ` (previous: ${prevCount})` : ''));
}
