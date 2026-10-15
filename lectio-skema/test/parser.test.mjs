import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBricks, scheduleUrl } from '../parser.mjs';
const source = 'https://www.lectio.dk/lectio/141/SkemaNy.aspx?week=432026';
const brick = {
  text: 'Biologi\n2x BI', title: 'Tid: 19/10-2026 08:10 til 09:45\nHold: 2x BI\nLærer: SM\nLokale: B12',
  href: 'aktivitet/aktivitetforside2.aspx?absid=123', classes: 's2skemabrik s2changed'
};
test('dates, fields, stable IDs and changed/cancelled flags', () => {
  const { events, warnings } = parseBricks([brick, brick, { ...brick, classes: 's2skemabrik s2cancelled' }], source);
  assert.equal(events.length, 1);
  assert.deepEqual(warnings, []);
  assert.deepEqual(events[0], {
    id: '123:2026-10-19T08:10:00', activityId: '123', title: 'Biologi · 2x BI',
    start: '2026-10-19T08:10:00', end: '2026-10-19T09:45:00', allDay: false, timeZone: 'Europe/Copenhagen',
    group: '2x BI', teacher: 'SM', room: 'B12', cancelled: true, changed: false
  });
});
test('current Lectio tooltip titles and plural teacher fields', () => {
  const result = parseBricks([{ ...brick, text: 'sms\nUdvalg • ... • Mødelokale\nIT-møde', title: 'IT-møde\n21/10-2026 08:10 til 09:45\nHold: Udvalg\nLærere: AA, BB\nLokale: Mødelokale\n\nNote:\nDagsorden' }], source);
  assert.equal(result.events[0].title, 'IT-møde');
  assert.equal(result.events[0].teacher, 'AA, BB');
  assert.equal(result.events[0].room, 'Mødelokale');
  assert.deepEqual(result.warnings, []);
});
test('all-day school calendar entries have exclusive next-day end, also across year and DST', () => {
  for (const [day, end] of [['19/10-2026', '2026-10-20'], ['25/10-2026', '2026-10-26'], ['31/12-2026', '2027-01-01']]) {
    const result = parseBricks([{ text: '• Skolearrangement', title: `Skolearrangement\n${day} Hele dagen`, href: '', classes: 's2skemabrik s2normal' }], source);
    assert.equal(result.events[0].allDay, true);
    assert.equal(result.events[0].title, 'Skolearrangement');
    assert.equal(result.events[0].end, `${end}T00:00:00`);
    assert.deepEqual(result.warnings, []);
  }
});
test('overnight activity has explicit end date', () => {
  const { events } = parseBricks([{ ...brick, title: 'Tid: 24/10-2026 23:15 til 25/10-2026 01:00' }], source);
  assert.equal(events[0].end, '2026-10-25T01:00:00');
});
test('a note mentioning cancellation does not cancel a normal lesson', () => {
  const result = parseBricks([{ ...brick, classes: 's2skemabrik s2normal', title: brick.title + '\nNote: Forrige modul var aflyst og ændret.' }], source);
  assert.equal(result.events[0].cancelled, false);
  assert.equal(result.events[0].changed, false);
});
test('unknown format and impossible dates are reported, not silently discarded', () => {
  for (const title of ['Tid: ukendt format', 'Tid: 31/02-2026 08:10 til 09:45', 'Tid: 19/10-2026 25:10 til 26:45', 'Tid: 19/10-2026 09:45 til 08:10']) {
    const result = parseBricks([{ ...brick, title }], source);
    assert.equal(result.events.length, 0); assert.equal(result.warnings.length, 1);
  }
  assert.deepEqual(parseBricks([], source), { events: [], warnings: [] });
});
test('only Lectio schedule URLs, with tokens stripped and week validated', () => {
  assert.equal(scheduleUrl(source + '&autologinkey=SECRET&type=laerer&laererid=123', '012027'), 'https://www.lectio.dk/lectio/141/SkemaNy.aspx?type=laerer&laererid=123&week=012027');
  for (const url of ['http://www.lectio.dk/lectio/141/SkemaNy.aspx', 'https://evil.example/lectio/141/SkemaNy.aspx', 'https://www.lectio.dk@evil.example/lectio/141/SkemaNy.aspx', 'https://www.lectio.dk/lectio/141/login.aspx']) assert.throws(() => scheduleUrl(url, '432026'));
  for (const week of ['002026', '542026', '1', '43NaN', '432126']) assert.throws(() => scheduleUrl(source, week));
});
