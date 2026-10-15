// Shared by the static import page and calendar. No Firebase or browser dependencies.
const DATE = /^20\d{2}-\d{2}-\d{2}$/;
const WALL = /^20\d{2}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const text = (v, max = 300) => typeof v === 'string' ? v.slice(0, max) : '';
export function validDate(value) {
  return DATE.test(value || '') && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function nextDate(value) {
  const d = new Date(value + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10);
}
export function schoolYear(date) {
  const year = Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 8 ? 1 : 0);
  return `${year}-${String(year + 1).slice(2)}`;
}
export function sourceIdentity(source) {
  const u = new URL(source);
  if (u.origin !== 'https://www.lectio.dk' || !/^\/lectio\/\d+\/SkemaNy\.aspx$/i.test(u.pathname) || u.username || u.password) throw new Error('Ugyldig Lectio-kilde.');
  const safe = new URL(u.origin + u.pathname);
  for (const key of ['type', 'laererid', 'elevid']) if (u.searchParams.has(key)) safe.searchParams.set(key, u.searchParams.get(key));
  return safe.href;
}
const creditNumber = v => Number.isFinite(v) && v >= 0 && v <= 10000 ? v : null;
function credits(value) {
  if (!value) return null;
  const row = r => ({ credited: typeof r.credited === 'boolean' ? r.credited : null, modules: creditNumber(r.modules) });
  const teachers = (Array.isArray(value.teachers) ? value.teachers : []).slice(0, 50).map(r => ({ ...row(r), teacher: text(r.teacher), group: text(r.group), extraHours: creditNumber(r.extraHours), role: text(r.role), cancellationReason: text(r.cancellationReason) }));
  const groups = (Array.isArray(value.groups) ? value.groups : []).slice(0, 50).map(r => ({ ...row(r), group: text(r.group) }));
  return { status: value.status === 'ok' && teachers.length && groups.length && [...teachers, ...groups].every(r => r.credited !== null) ? 'ok' : 'unknown', teachers, groups, fetchedAt: text(value.fetchedAt, 40) };
}
export function validateLectio(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.events) || snapshot.events.length > 2500) throw new Error('Filen er ikke et understøttet Lectio-skema.');
  const range = snapshot.range;
  if (!range || !validDate(range.from) || !validDate(range.to) || range.from > range.to || (Date.parse(range.to) - Date.parse(range.from)) / 86400000 > 370) throw new Error('Ugyldig skemaperiode.');
  const source = sourceIdentity(snapshot.source);
  const update = snapshot.lastUpdate || { mode: 'all', ...range };
  if (!['all', 'future'].includes(update.mode) || !validDate(update.from) || !validDate(update.to) || update.from < range.from || update.to > range.to || update.from > update.to || (update.mode === 'all' && (update.from !== range.from || update.to !== range.to))) throw new Error('Ugyldig opdateringsperiode.');
  if (!Number.isFinite(Date.parse(snapshot.fetchedAt))) throw new Error('Skemaet mangler hentetidspunkt.');
  const ids = new Set();
  const events = snapshot.events.map(e => {
    if (!e || typeof e.id !== 'string' || !e.id || e.id.length > 500 || ids.has(e.id) || !WALL.test(e.start) || !WALL.test(e.end) || !validDate(e.start.slice(0, 10)) || !validDate(e.end.slice(0, 10)) || e.end <= e.start || e.start.slice(0, 10) > range.to || e.end <= range.from + 'T00:00:00' || e.timeZone !== 'Europe/Copenhagen') throw new Error('En aktivitet har ugyldigt ID, dato eller tidsrum.');
    ids.add(e.id);
    return { id: e.id, activityId: /^\d+$/.test(e.activityId || '') ? e.activityId : null, title: text(e.title), start: e.start, end: e.end, timeZone: 'Europe/Copenhagen', allDay: e.allDay === true, group: text(e.group), teacher: text(e.teacher), room: text(e.room), cancelled: e.cancelled === true, changed: e.changed === true, credits: credits(e.credits) };
  });
  return { schemaVersion: 1, source, range: { from: range.from, to: range.to }, lastUpdate: { mode: update.mode, from: update.from, to: update.to }, fetchedAt: new Date(snapshot.fetchedAt).toISOString(), events };
}
export function yearsInRange(from, to) {
  const years = new Set([schoolYear(from), schoolYear(to)]); return [...years].sort();
}
export function mergeLectio(previous, incoming, year) {
  if (previous?.source && sourceIdentity(previous.source) !== incoming.source) throw new Error('Der ligger allerede et skema fra en anden Lectio-profil i dette skoleår.');
  if (previous?.fetchedAt && previous.fetchedAt > incoming.fetchedAt) throw new Error('Firebase har et nyere skema. Opdater i Lectio-programmet først.');
  const from = incoming.lastUpdate.from + 'T00:00:00', end = nextDate(incoming.lastUpdate.to) + 'T00:00:00';
  const events = new Map((previous?.events || []).filter(e => e.end <= from || e.start >= end).map(e => [e.id, e]));
  for (const e of incoming.events) if (schoolYear(e.start) === year && e.end > from && e.start < end) events.set(e.id, e);
  return { schemaVersion: 1, source: incoming.source, schoolYear: year, fetchedAt: incoming.fetchedAt, lastUpdate: incoming.lastUpdate, events: [...events.values()].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id)) };
}

// Convert a Danish wall time explicitly, including DST; do not assume device timezone.
const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
export function danishDate(value) {
  const target = Date.parse(value + 'Z');
  let ms = target;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(parts.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    ms += target - wall;
  }
  return new Date(ms);
}

export function creditLines(event) {
  if (!event.cancelled) return [];
  const c = event.credits;
  if (!c) return ['Kreditering ukendt'];
  const describe = r => r.credited === null ? 'ukendt' : r.credited ? `ja${r.modules == null ? '' : ` (${r.modules} modul${r.modules === 1 ? '' : 'er'})`}` : 'nej';
  return [...(c.status !== 'ok' ? ['Kreditering ukendt'] : []),
    ...c.teachers.map(r => `Lærer ${r.teacher}: ${describe(r)}${r.cancellationReason ? ' · ' + r.cancellationReason : ''}`),
    ...c.groups.map(r => `Hold ${r.group}: ${describe(r)}`)];
}
