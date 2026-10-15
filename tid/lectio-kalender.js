import { esc } from './format.js';
import { danishDate, creditLines } from './lectio-data.js';
import { openSheet, closeSheet } from './ark.js';

export function lectioPoster(events, Timestamp) {
  return events.filter(e => !e.allDay).flatMap(e => {
    const start = danishDate(e.start), end = danishDate(e.end);
    if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) return [];
    return [{ id: `lectio:${encodeURIComponent(e.id)}`, isLectio: true, lectio: e, startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(end) }];
  });
}
export function lectioNavn(event) {
  const title = /^(?:aflyst|ændret)!?$/i.test(event.title) ? '' : event.title;
  return [event.group, title && title !== event.group ? title : ''].filter(Boolean).join(' · ') || 'Lectio-aftale';
}
export function visLectio(event) {
  let sheet = document.getElementById('lectio-sheet');
  if (!sheet) {
    const backdrop = document.createElement('div'); backdrop.id = 'lectio-backdrop'; backdrop.className = 'sheet-backdrop hidden';
    sheet = document.createElement('div'); sheet.id = 'lectio-sheet'; sheet.className = 'sheet hidden';
    sheet.innerHTML = '<div class="sheet-head"><h3>Lectio-aftale</h3><button type="button" class="btn-icon" aria-label="Luk Lectio-aftale">✕</button></div><div class="sheet-body" id="lectio-sheet-body"></div>';
    document.body.append(backdrop, sheet);
    const close = () => closeSheet('lectio-sheet', 'lectio-backdrop');
    sheet.querySelector('button').addEventListener('click', close); backdrop.addEventListener('click', close);
    sheet.addEventListener('keydown', ev => { if (ev.key === 'Escape') close(); });
  }
  const body = document.getElementById('lectio-sheet-body'); body.replaceChildren();
  const add = (tag, value) => { const el = document.createElement(tag); el.textContent = value; body.append(el); };
  add('h4', lectioNavn(event));
  add('p', `${event.start.slice(0, 10)} · ${event.allDay ? 'Hele dagen' : event.start.slice(11, 16) + '–' + event.end.slice(11, 16)} · ${event.cancelled ? 'Aflyst' : 'Planlagt'}`);
  add('p', [event.room && 'Lokale ' + event.room, event.teacher].filter(Boolean).join(' · '));
  for (const line of creditLines(event)) add('p', line);
  add('p', 'Fra Lectio. Aftalen er ikke en registrering af arbejdstid.');
  openSheet('lectio-sheet', 'lectio-backdrop');
}
export function tegnLectioListe(root, events, from, to, fetchedAt, visible) {
  if (!root) return;
  root.replaceChildren();
  if (!visible) return;
  const filtered = events.filter(e => danishDate(e.start) < to && danishDate(e.end) > from);
  const heading = document.createElement('h3'); heading.textContent = 'Planlagt i Lectio'; root.append(heading);
  const info = document.createElement('p'); info.className = 'settings-sub';
  info.textContent = fetchedAt ? `${filtered.length} aftaler i perioden · Sidst hentet ${new Date(fetchedAt).toLocaleString('da-DK')}` : 'Åbn Lectio-programmet på computeren, og vælg Send til Tid for at importere dit skema.';
  root.append(info);
  for (const e of filtered) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `lectio-plan-row${e.cancelled ? ' lectio-cancelled' : ''}`;
    button.innerHTML = `<span>${esc(e.start.slice(8, 10) + '/' + e.start.slice(5, 7))} · ${e.allDay ? 'Hele dagen' : esc(e.start.slice(11, 16) + '–' + e.end.slice(11, 16))}</span><strong>${esc(lectioNavn(e))}</strong><span>${e.cancelled ? 'Aflyst' : 'Planlagt'}${e.room ? ' · ' + esc(e.room) : ''}</span>`;
    button.addEventListener('click', () => visLectio(e)); root.append(button);
  }
}
