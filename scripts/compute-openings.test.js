// Tests for compute-openings.js. Run: npm test
'use strict';

const assert = require('assert');
const { computeOpenings } = require('./compute-openings');

const NOW = '2026-11-15T20:00'; // Sunday evening, so Mon Nov 16 is fully in the future
const free = (h = '08:00-17:00') => ({ hours: h, busy: [] });
const off = () => ({ hours: '', busy: [] });
const day = (date, staff) => ({ date, staff: { Rachel: off(), Xavier: off(), Sammy: off(), ...staff }, problems: [] });
const run = (days, now = NOW) => computeOpenings(days, now).slots;
const has = (slots, date, time, service) => slots.some((s) => s.date === date && s.time === time && s.service === service);
const times = (slots, service) => slots.filter((s) => s.service === service).map((s) => s.time);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`ok ${n} - ${name}`); };

test('a service must fit inside working hours', () => {
  const s = run([day('Nov 16', { Rachel: free('08:00-10:00') })]);
  assert.deepStrictEqual(times(s, 'Body Comp FIT'), ['08:00', '08:30', '09:00']);
});

test('bookings and personal events block the staff member', () => {
  const s = run([day('Nov 16', { Rachel: { hours: '08:00-11:00', busy: ['09:00-10:00 (personal)'] } })]);
  assert.deepStrictEqual(times(s, 'Body Comp FIT'), ['08:00', '10:00']);
});

test('Rachel never gets aerobic tests on her own', () => {
  const s = run([day('Nov 16', { Rachel: free() })]);
  assert.strictEqual(times(s, 'Aerobic FIT').length, 0);
  assert.strictEqual(times(s, 'Lactate FIT').length, 0);
});

test('one metabolic cart: a cart booking blocks other cart services', () => {
  const s = run([day('Nov 16', {
    Xavier: { hours: '08:00-17:00', busy: ['09:00-10:30 Longhorn Aerobic FIT'] },
    Sammy: free(),
  })]);
  assert.ok(!has(s, '2026-11-16', '09:00', 'Lactate FIT'), 'Sammy is free but the cart is not');
  assert.ok(has(s, '2026-11-16', '10:30', 'Lactate FIT'));
});

test('at most two DXA at once', () => {
  const two = run([day('Nov 16', {
    Rachel: { hours: '08:00-17:00', busy: ['09:00-10:00 Longhorn Body Comp FIT'] },
    Xavier: { hours: '08:00-17:00', busy: ['09:00-10:00 GetFIT Post DXA'] },
    Sammy: free(),
  })]);
  assert.ok(!has(two, '2026-11-16', '09:00', 'Body Comp FIT'), 'third DXA not allowed');
  const one = run([day('Nov 16', {
    Rachel: { hours: '08:00-17:00', busy: ['09:00-10:00 Longhorn Body Comp FIT'] },
    Sammy: free(),
  })]);
  assert.ok(has(one, '2026-11-16', '09:00', 'Body Comp FIT'), 'second DXA allowed');
});

test('services that use no machine (Muscle FIT, Zoom check-ins) do not block equipment', () => {
  const s = run([day('Nov 16', {
    Rachel: { hours: '08:00-17:00', busy: ['09:00-09:30 Longhorn Health Coach Check In'] },
    Xavier: free(),
  })]);
  assert.ok(has(s, '2026-11-16', '09:00', 'Lactate FIT'));
});

test('unknown service names block both machines and are reported', () => {
  const r = computeOpenings([day('Nov 16', {
    Rachel: { hours: '08:00-17:00', busy: ['09:00-10:00 Longhorn Mystery Test'] },
    Xavier: free(),
  })], NOW);
  assert.ok(!has(r.slots, '2026-11-16', '09:00', 'Lactate FIT'));
  assert.deepStrictEqual(r.unknown, ['mystery test']);
});

test('RMR: Rachel only, 7:30-9:00 starts', () => {
  const s = run([day('Nov 16', { Rachel: free('07:00-17:00'), Xavier: free('07:00-17:00') })]);
  assert.deepStrictEqual(times(s, 'RMR'), ['07:30', '08:00', '08:30', '09:00']);
});

test('Body Comp + aerobic: Rachel DXA then Xavier/Sammy split is allowed', () => {
  // Xavier busy until 09:30, so he can't do the whole 09:00 block, but can take over at 09:30.
  const s = run([day('Nov 16', {
    Rachel: free(),
    Xavier: { hours: '08:00-17:00', busy: ['08:00-09:30 (personal)'] },
  })]);
  assert.ok(has(s, '2026-11-16', '09:00', 'Body Comp + Lactate FIT'));
  assert.ok(!has(s, '2026-11-16', '08:30', 'Body Comp + Lactate FIT'), 'Xavier not free from 09:00');
});

test('Bone Density FIT is never listed', () => {
  const s = run([day('Nov 16', { Rachel: free() })]);
  assert.strictEqual(times(s, 'Bone Density FIT').length, 0);
});

test('weekends are skipped', () => {
  const s = run([day('Nov 21', { Rachel: free() })], '2026-11-16T07:00');
  assert.strictEqual(s.length, 0);
});

test('times already past today are skipped', () => {
  const s = run([day('Nov 16', { Rachel: free() })], '2026-11-16T10:15');
  assert.strictEqual(times(s, 'Body Comp FIT')[0], '10:30');
});

test('days with reading problems are skipped', () => {
  const d = day('Nov 16', { Rachel: free() });
  d.problems = ['no shaded hours on the page'];
  assert.strictEqual(run([d]).length, 0);
});

test('a day missing one of the three staff is skipped', () => {
  const d = day('Nov 16', { Rachel: free() });
  delete d.staff.Sammy;
  assert.strictEqual(run([d]).length, 0);
});

test('January read in December gets next year', () => {
  const s = run([day('Jan 4', { Rachel: free() })], '2026-12-30T12:00');
  assert.ok(s.length > 0 && s[0].date === '2027-01-04');
});

console.log(`# ${n} tests passed`);
