import { initTidBridge } from './tid-bridge.js';
const $ = id => document.getElementById(id);
let busy = false, initialized = false, dirty = false, serverBusy = false, currentSnapshot = null;
let lastRenderKey = '';
const sendToTid = initTidBridge(() => currentSnapshot);
const dateFmt = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
function notice(text, error = false) { $('notice').textContent = text; $('notice').classList.toggle('error', error); }
function node(tag, text, cls) { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; }
function chosenWeek() { const [year, week] = $('week').value.split('-W'); return `${week}${year}`; }
async function api(route, body) {
  const response = await fetch(`/api/${route}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Kunne ikke hente data.');
  return result;
}
function render(snapshot) {
  currentSnapshot = snapshot;
  $('download').hidden = !snapshot;
  if (!snapshot) return;
  const renderKey = JSON.stringify([snapshot.fetchedAt, snapshot.source, $('url').value, $('from').value, $('to').value, $('month').value, $('cancelled-only').checked]);
  if (renderKey === lastRenderKey) return;
  lastRenderKey = renderKey;
  const identity = value => {
    try { const u = new URL(value); return [u.pathname, u.searchParams.get('type'), u.searchParams.get('laererid'), u.searchParams.get('elevid')].join('|'); }
    catch { return ''; }
  };
  const isMismatch = (snapshot.range ? snapshot.range.from !== $('from').value || snapshot.range.to !== $('to').value : true) || identity(snapshot.source) !== identity($('url').value);
  $('mismatch').hidden = !isMismatch;
  $('mismatch').textContent = 'Viser det senest hentede skema. Tryk Opdater alt for at hente hele dit nye valg.';
  const shortDate = value => new Date(value + 'T12:00:00Z').toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  $('schedule-title').textContent = snapshot.range ? `${shortDate(snapshot.range.from)} – ${shortDate(snapshot.range.to)}` : `Uge ${Number(snapshot.week.slice(0, 2))} · ${snapshot.week.slice(2)}`;
  $('updated').textContent = `Hentet ${new Date(snapshot.fetchedAt).toLocaleString('da-DK')} · ${snapshot.events.length} aktiviteter · Opdateres kun med knapperne`;
  const days = $('days'); days.replaceChildren();
  if (!snapshot.events.length) { days.append(node('div', 'Ingen aktiviteter i denne uge.', 'empty')); return; }
  const months = [...new Set(snapshot.events.map(event => event.start.slice(0, 7)))];
  const selectedMonth = $('month').value;
  $('month').replaceChildren(node('option', 'Hele perioden'));
  $('month').firstChild.value = '';
  for (const month of months) {
    const option = node('option', new Date(month + '-15T12:00:00Z').toLocaleDateString('da-DK', { month: 'long', year: 'numeric', timeZone: 'UTC' }));
    option.value = month; $('month').append(option);
  }
  $('month').value = months.includes(selectedMonth) ? selectedMonth : '';
  const grouped = new Map();
  for (const event of snapshot.events) {
    if ($('month').value && !event.start.startsWith($('month').value)) continue;
    if ($('cancelled-only').checked && !event.cancelled) continue;
    const date = event.start.slice(0, 10);
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(event);
  }
  if (!grouped.size) days.append(node('div', 'Ingen aktiviteter med det valgte filter.', 'empty'));
  for (const [date, events] of grouped) {
    const section = node('section', '', 'day'); section.append(node('h3', dateFmt.format(new Date(`${date}T12:00:00Z`))));
    for (const event of events) {
      const row = node('article', '', `event${event.cancelled ? ' cancelled' : ''}`);
      const time = node('time', event.allDay ? 'Hele dagen' : `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`); time.dateTime = event.start;
      const detail = node('div', ''); detail.append(node('strong', event.title));
      detail.append(node('p', [event.group, event.room && `Lokale ${event.room}`, event.teacher].filter(Boolean).join(' · ')));
      if (event.cancelled) {
        const credits = event.credits;
        if (!credits || credits.status !== 'ok') detail.append(node('p', 'Kreditering: ukendt', 'credit-info'));
        if (credits) {
          const describe = item => item.credited === null ? 'ukendt' : item.credited ? `ja${item.modules === null ? '' : ` (${item.modules} modul${item.modules === 1 ? '' : 'er'})`}` : 'nej';
          for (const teacher of credits.teachers) detail.append(node('p', `Lærer ${teacher.teacher}: ${describe(teacher)}${teacher.role ? ' · Rolle: ' + teacher.role : ''}${teacher.cancellationReason ? ' · Årsag: ' + teacher.cancellationReason : ''}`, 'credit-info'));
          for (const group of credits.groups) detail.append(node('p', `Hold ${group.group}: ${describe(group)}`, 'credit-info'));
        }
      }
      row.append(time, detail);
      if (event.cancelled || event.changed) row.append(node('span', event.cancelled ? 'Aflyst' : 'Ændret', 'flag'));
      section.append(row);
    }
    days.append(section);
  }
}
async function refresh() {
  const state = await api('status');
  if (!initialized) {
    $('url').value = state.config.url;
    $('week').value = `${state.config.week.slice(2)}-W${state.config.week.slice(0, 2)}`;
    $('from').value = state.config.from || '2026-08-01';
    $('to').value = state.config.to || '2026-12-31';
    initialized = true;
  }
  serverBusy = Boolean(state.syncing);
  if ((!busy && !dirty) || serverBusy) notice(state.status, state.needsLogin && Boolean(state.lastAttempt));
  document.querySelectorAll('button').forEach(b => { b.disabled = busy || serverBusy; });
  render(state.snapshot);
  sendToTid();
}
async function save() {
  if (!$('setup').reportValidity()) throw new Error('Udfyld link og uge.');
  await api('config', { url: $('url').value, week: chosenWeek(), from: $('from').value, to: $('to').value }); dirty = false;
}
async function action(work) {
  busy = true; document.querySelectorAll('button').forEach(b => { b.disabled = true; });
  try { await work(); await refresh(); }
  catch (error) { notice(error.message, true); }
  finally { busy = false; document.querySelectorAll('button').forEach(b => { b.disabled = serverBusy; }); }
}
$('setup').addEventListener('input', () => { dirty = true; });
$('month').addEventListener('change', () => render(currentSnapshot));
$('cancelled-only').addEventListener('change', () => render(currentSnapshot));
$('setup').addEventListener('submit', event => { event.preventDefault(); action(async () => { await save(); notice('Valget er gemt. Tryk Opdater alt.'); }); });
$('login').addEventListener('click', () => action(async () => { await save(); notice('Åbner Lectio…'); const result = await api('login', {}); notice(result.status); }));
for (const [id, mode] of [['sync', 'future'], ['sync-all', 'all']]) {
  $(id).addEventListener('click', () => action(async () => { await save(); notice('Henter skema fra Lectio…'); await api('sync', { mode }); const state = await api('status'); notice(state.status); }));
}
refresh().catch(error => notice(error.message, true));
setInterval(() => { if (!busy) refresh().catch(error => notice(error.message, true)); }, 3000);
