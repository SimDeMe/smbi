import test from 'node:test';
import assert from 'node:assert/strict';
import { weeksForRange, collectRange, updateRange, mergeUpdate } from '../range.mjs';
test('August through Christmas includes partial boundary weeks', () => {
  const weeks = weeksForRange('2026-08-01', '2026-12-31');
  assert.equal(weeks.length, 23);
  assert.equal(weeks[0], '312026');
  assert.equal(weeks.at(-1), '532026');
  assert.ok(weeks.includes('432026'));
});
test('future updates start today in Copenhagen, full updates include history', () => {
  const config = { from: '2026-08-01', to: '2026-12-31' };
  const future = updateRange(config, 'future', '2026-10-15');
  assert.equal(future.from, '2026-10-15');
  assert.equal(future.weeks[0], '422026');
  assert.equal(future.weeks.length, 12);
  assert.equal(updateRange(config, 'all', '2026-10-15').weeks.length, 23);
  assert.equal(updateRange(config, 'future', '2026-07-01').from, config.from);
  assert.throws(() => updateRange(config, 'future', '2027-01-01'));
});
test('future updates preserve history, replace edits, and remove deleted future events', () => {
  const source = 'https://www.lectio.dk/lectio/141/SkemaNy.aspx?week=432026';
  const old = { id: 'old', start: '2026-08-15T08:10:00', end: '2026-08-15T09:45:00' };
  const future = { id: 'future', start: '2026-10-19T08:10:00', end: '2026-10-19T09:45:00' };
  const deleted = { ...future, id: 'deleted' };
  const edited = { ...future, room: 'New room', cancelled: true };
  const previous = { source, events: [old, future, deleted] };
  const range = { from: '2026-08-01', to: '2026-12-31' };
  assert.deepEqual(mergeUpdate(previous, [{ events: [edited] }], source.replace('432026', '422026'), range, '2026-10-15'), [old, edited]);
  assert.deepEqual(mergeUpdate(previous, [{ events: [edited] }], source, range, '2026-08-01'), [edited]);
  assert.deepEqual(mergeUpdate(previous, [{ events: [edited] }], source.replace('/141/', '/999/'), range, '2026-10-15'), [edited]);
});
test('ISO week year at New Year', () => {
  assert.deepEqual(weeksForRange('2026-12-31', '2027-01-05'), ['532026', '012027']);
  assert.deepEqual(weeksForRange('2026-01-01', '2026-01-01'), ['012026']);
});
test('invalid and oversized ranges are rejected', () => {
  for (const pair of [['2026-02-30', '2026-03-01'], ['2026-12-31', '2026-08-01'], ['2026-01-01', '2028-01-01'], ['', '2026-08-01']]) assert.throws(() => weeksForRange(...pair));
});
test('merge preserves cancelled events, deduplicates, sorts and clips range boundaries', () => {
  const a = { id: 'a', start: '2026-08-01T08:00:00', end: '2026-08-01T09:00:00', cancelled: true };
  const b = { id: 'b', start: '2026-12-31T08:00:00', end: '2026-12-31T09:00:00' };
  const outside = { id: 'x', start: '2027-01-01T08:00:00', end: '2027-01-01T09:00:00' };
  assert.deepEqual(collectRange([{ events: [b, a, outside] }, { events: [a] }], '2026-08-01', '2026-12-31'), [a, b]);
});
