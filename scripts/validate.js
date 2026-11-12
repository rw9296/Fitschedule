#!/usr/bin/env node
// Validates public/availability.json before it is committed.
// No dependencies. Exits 1 with a clear message on any failure.
//
// Usage: node scripts/validate.js [--structure-only] [path/to/availability.json]
//
// --structure-only skips the freshness and date-window checks. The deploy
// workflow uses it so a later push of index.html still deploys while the
// data is a few hours old. The hourly sync always runs the full check.

'use strict';

const fs = require('fs');
const path = require('path');

// Keep in sync with "Fill these in" at the top of PLAN.md.
const TIMEZONE = 'America/Chicago';
const DAYS_AHEAD = 7;

const MAX_AGE_MINUTES = 15;
const FUTURE_SKEW_MINUTES = 2; // tolerate small clock differences
const EARLIEST = '06:00';
const LATEST = '22:00';
const MAX_SLOTS = 300;

const args = process.argv.slice(2);
const structureOnly = args.includes('--structure-only');
const file = args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'public', 'availability.json');

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

// Current wall-clock time in TIMEZONE, as parts.
function nowInZone() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

// Wall-clock parts -> comparable number (ms). Treats wall time as if it were UTC,
// which is fine for comparing two wall-clock times in the same zone.
const wallMs = ({ y, mo, d, h = 0, mi = 0, s = 0 }) => Date.UTC(y, mo - 1, d, h, mi, s);

function parseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, mo, d };
}

// --- 1. Parses as JSON ---------------------------------------------------
let raw;
try {
  raw = fs.readFileSync(file, 'utf8');
} catch (e) {
  fail(`cannot read ${file}: ${e.message}`);
}
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail(`not valid JSON: ${e.message}`);
}
if (!data || typeof data !== 'object' || Array.isArray(data)) fail('top level must be an object');

// --- 2. updated is a recent local timestamp -----------------------------
const um = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(data.updated || '');
if (!um) {
  fail(`"updated" must be local ISO time like 2026-11-08T15:00:00 with no Z or offset (got ${JSON.stringify(data.updated)})`);
}
const updated = { y: +um[1], mo: +um[2], d: +um[3], h: +um[4], mi: +um[5], s: +(um[6] || 0) };
if (!parseDate(`${um[1]}-${um[2]}-${um[3]}`) || updated.h > 23 || updated.mi > 59 || updated.s > 59) {
  fail(`"updated" is not a real date/time: ${data.updated}`);
}
const now = nowInZone();
const ageMin = (wallMs(now) - wallMs(updated)) / 60000;
if (!structureOnly && ageMin > MAX_AGE_MINUTES) {
  fail(`"updated" is ${Math.round(ageMin)} minutes old (max ${MAX_AGE_MINUTES}). Current ${TIMEZONE} time is ${String(now.h).padStart(2, '0')}:${String(now.mi).padStart(2, '0')}.`);
}
if (!structureOnly && ageMin < -FUTURE_SKEW_MINUTES) {
  fail(`"updated" is ${Math.round(-ageMin)} minutes in the future. Is it in ${TIMEZONE} local time?`);
}

// --- 3. timezone ----------------------------------------------------------
if (data.timezone !== TIMEZONE) fail(`"timezone" must be "${TIMEZONE}" (got ${JSON.stringify(data.timezone)})`);

// --- 4-8. days and slots ------------------------------------------------
if (!Array.isArray(data.days)) fail('"days" must be an array');

const todayMs = wallMs({ y: now.y, mo: now.mo, d: now.d });
const lastAllowedMs = todayMs + (DAYS_AHEAD + 1) * 86400000;
const timeRe = /^\d{2}:\d{2}$/;
const seen = new Set();
let total = 0;
let prevDate = null;

data.days.forEach((day, i) => {
  const where = `days[${i}]`;
  if (!day || typeof day !== 'object') fail(`${where} must be an object`);
  const date = parseDate(day.date);
  if (!date) fail(`${where}.date must be a real date in YYYY-MM-DD (got ${JSON.stringify(day.date)})`);
  const dMs = wallMs(date);
  if (!structureOnly && dMs < todayMs) fail(`${where}.date ${day.date} is in the past`);
  if (!structureOnly && dMs > lastAllowedMs) fail(`${where}.date ${day.date} is more than ${DAYS_AHEAD + 1} days ahead`);
  if (prevDate !== null && day.date <= prevDate) fail(`days not sorted or duplicated: ${day.date} comes after ${prevDate}`);
  prevDate = day.date;

  if (!Array.isArray(day.slots) || day.slots.length === 0) {
    fail(`${where} (${day.date}) must have a non-empty "slots" array (omit days with no slots)`);
  }

  let prevTime = null;
  day.slots.forEach((slot, j) => {
    const sw = `${day.date} slots[${j}]`;
    if (!slot || typeof slot !== 'object') fail(`${sw} must be an object`);
    const t = slot.time;
    if (typeof t !== 'string' || !timeRe.test(t)) fail(`${sw}.time must be HH:MM 24h (got ${JSON.stringify(t)})`);
    const [hh, mm] = t.split(':').map(Number);
    if (hh > 23 || mm > 59) fail(`${sw}.time ${t} is not a real time`);
    if (t < EARLIEST || t > LATEST) fail(`${sw}.time ${t} is outside ${EARLIEST}-${LATEST}`);
    if ('service' in slot && (typeof slot.service !== 'string' || !slot.service.trim())) {
      fail(`${sw}.service must be a non-empty string when present`);
    }
    // Different services may share a start time; the same service may not.
    const key = `${day.date} ${t} ${slot.service || ''}`.trim();
    if (seen.has(key)) fail(`duplicate slot ${key}`);
    seen.add(key);
    if (prevTime !== null && t < prevTime) fail(`slots on ${day.date} not sorted: ${t} comes after ${prevTime}`);
    prevTime = t;
    total++;
  });
});

if (total < 0 || total > MAX_SLOTS) fail(`total slot count ${total} is outside 0-${MAX_SLOTS}`);

const hhmm = `${String(updated.h).padStart(2, '0')}:${String(updated.mi).padStart(2, '0')}`;
console.log(`OK${structureOnly ? ' (structure only)' : ''}: ${total} slot${total === 1 ? '' : 's'} across ${data.days.length} day${data.days.length === 1 ? '' : 's'}, updated ${hhmm}.`);
