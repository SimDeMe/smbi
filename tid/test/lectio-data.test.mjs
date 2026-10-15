import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLectio, mergeLectio, danishDate, yearsInRange } from '../lectio-data.js';
const event = (id, date) => ({ id, activityId: '123', title: 'Geografi', start: date + 'T08:10:00', end: date + 'T09:45:00', timeZone: 'Europe/Copenhagen', group: '2x', teacher: 'AA', room: '12' });
const raw = events => ({ schemaVersion: 1, source: 'https://www.lectio.dk/lectio/141/SkemaNy.aspx?week=432026&autologinkey=secret', range: { from: '2026-08-01', to: '2026-12-31' }, fetchedAt: '2026-10-15T14:00:00Z', events });
test('import strips authentication parameters and unrecognized fields', () => {
  const data = validateLectio(raw([{ ...event('a', '2026-10-19'), accessToken: 'secret' }]));
  assert.equal(data.source.includes('secret'), false);
  assert.equal('accessToken' in data.events[0], false);
  assert.equal('durationMinutes' in data.events[0], false);
});
test('future import retains cloud history, replaces updates and removes deleted future events', () => {
  const old = event('past', '2026-08-17'), future = event('future', '2026-10-19');
  const previous = { source: validateLectio(raw([])).source, fetchedAt: '2026-10-14T14:00:00Z', events: [old, future, event('deleted', '2026-10-20')] };
  const incoming = validateLectio({ ...raw([{ ...future, room: '99', cancelled: true }]), lastUpdate: { mode: 'future', from: '2026-10-15', to: '2026-12-31' } });
  const result = mergeLectio(previous, incoming, '2026-27');
  assert.equal(result.events.length, 2); assert.equal(result.events[0].id, 'past');
  assert.equal(result.events[1].room, '99'); assert.equal(result.events[1].cancelled, true);
  assert.deepEqual(mergeLectio(result, incoming, '2026-27'), result);
});
test('full imports only replace their own date range and keep other periods', () => {
  const previous = { source: validateLectio(raw([])).source, events: [event('old', '2026-08-17'), event('outside', '2027-01-19')] };
  const result = mergeLectio(previous, validateLectio(raw([])), '2026-27');
  assert.deepEqual(result.events.map(e => e.id), ['outside']);
});
test('stale imports, other profiles, duplicate IDs and invalid ranges are rejected', () => {
  const incoming = validateLectio(raw([event('a', '2026-10-19')]));
  assert.throws(() => mergeLectio({ source: incoming.source, fetchedAt: '2026-10-16T00:00:00Z' }, incoming, '2026-27'));
  assert.throws(() => mergeLectio({ source: incoming.source.replace('/141/', '/999/') }, incoming, '2026-27'));
  assert.throws(() => validateLectio(raw([event('a', '2026-10-19'), event('a', '2026-10-20')])));
  assert.throws(() => validateLectio({ ...raw([]), lastUpdate: { mode: 'future', from: '2026-07-01', to: '2026-12-31' } }));
});
test('teacher and group credits stay separate, missing is not false', () => {
  const data = validateLectio(raw([{ ...event('a', '2026-10-19'), cancelled: true, credits: { status: 'ok', teachers: [{ teacher: 'AA', credited: true, modules: 1 }], groups: [{ group: '2x', credited: false, modules: 1 }] } }]));
  assert.equal(data.events[0].credits.teachers[0].credited, true);
  assert.equal(data.events[0].credits.groups[0].credited, false);
  assert.equal(data.events[0].credits.teachers[0].extraHours, null);
});
test('Danish times convert correctly across DST regardless of device timezone', () => {
  assert.equal(danishDate('2026-10-19T08:10:00').toISOString(), '2026-10-19T06:10:00.000Z');
  assert.equal(danishDate('2026-10-26T08:10:00').toISOString(), '2026-10-26T07:10:00.000Z');
  assert.deepEqual(yearsInRange('2026-07-31', '2026-08-01'), ['2025-26', '2026-27']);
});
