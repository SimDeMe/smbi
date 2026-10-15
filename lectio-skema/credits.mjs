import { scheduleUrl } from './parser.mjs';

export function creditUrl(source, activityId) {
  if (!/^\d+$/.test(activityId || '')) throw new Error('Aktiviteten mangler et gyldigt Lectio-ID.');
  const base = new URL(scheduleUrl(source, '012026'));
  base.pathname = base.pathname.replace(/SkemaNy\.aspx/i, 'aktivitet/aktivitetrediger.aspx');
  base.search = new URLSearchParams({ action: 'edit', id: activityId }).toString();
  return base.href;
}

// Read only: the editor exposes both credit checkboxes. Never submit this form.
export function readCredits() {
  const clean = s => (s || '').replace(/\u00ad/g, '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const key = s => clean(s).toLocaleLowerCase('da-DK').replace(/\s/g, '');
  const number = cell => {
    if (!cell) return null;
    const value = clean(cell.querySelector('input:not([type="hidden"]):not([type="checkbox"])')?.value || cell.textContent);
    if (!/^-?\d+(?:[.,]\d+)?$/.test(value)) return null;
    return Number(value.replace(',', '.'));
  };
  const value = cell => {
    if (!cell) return '';
    const select = cell.querySelector('select');
    if (select) return clean(select.selectedOptions[0]?.textContent);
    const input = cell.querySelector('input:not([type="hidden"])');
    return clean(input ? input.value : cell.textContent);
  };
  let teachers = null, groups = null;
  for (const table of document.querySelectorAll('table')) {
    const rows = [...table.rows];
    const header = rows.find(r => [...r.cells].some(c => ['krediteretlærer', 'krediterethold'].includes(key(c.textContent))));
    if (!header) continue;
    const headers = [...header.cells].map(c => key(c.textContent));
    const teacher = headers.includes('krediteretlærer');
    const index = name => headers.indexOf(name);
    const entries = rows.slice(rows.indexOf(header) + 1).filter(r => r.cells.length === headers.length).map(row => {
      const cells = [...row.cells];
      const cell = name => cells[index(name)];
      const checkbox = cell('kreditér')?.querySelector('input[type="checkbox"]');
      return {
        [teacher ? 'teacher' : 'group']: value(cell(teacher ? 'krediteretlærer' : 'krediterethold')),
        credited: checkbox ? checkbox.checked : null,
        modules: number(cell('moduler')),
        ...(teacher ? { group: value(cell('hold')), extraHours: number(cell('ekstratimer')),
          role: value(cell('krediteringsrolle')), cancellationReason: value(cell('aflysningsårsag')) } : {})
      };
    });
    if (teacher) teachers = entries; else groups = entries;
  }
  const status = teachers?.length && groups?.length && [...teachers, ...groups].every(e => e.credited !== null) ? 'ok' : 'unknown';
  return { status, teachers: teachers || [], groups: groups || [] };
}
