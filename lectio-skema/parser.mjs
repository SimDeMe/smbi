// Runs inside the Lectio page. No cookies or login data leave the browser.
export function readSchedule() {
  const clean = s => (s || '').replace(/\u00a0/g, ' ').trim();
  const elements = [...document.querySelectorAll('.s2skemabrik')];
  return {
    recognized: Boolean(document.querySelector('.s2skema, .s2skemaContainer, .s2weekHeader, .s2dayHeader') || elements.length),
    login: Boolean(document.querySelector('input[type="password"]')) || /\/login\.aspx/i.test(location.pathname),
    bricks: elements.map(el => ({
      text: clean(el.innerText),
      title: clean(el.getAttribute('data-tooltip') || el.getAttribute('title') || el.querySelector('[data-tooltip]')?.getAttribute('data-tooltip') || el.querySelector('[title]')?.getAttribute('title')),
      href: el.closest('a[href]')?.getAttribute('href') || el.querySelector('a[href]')?.getAttribute('href') || '',
      classes: el.className
    }))
  };
}

export function scheduleUrl(value, week) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.hostname !== 'www.lectio.dk' || u.port || u.username || u.password ||
      !/^\/lectio\/\d+\/SkemaNy\.aspx$/i.test(u.pathname)) {
    throw new Error('Brug et skemalink fra https://www.lectio.dk/lectio/…/SkemaNy.aspx');
  }
  // Keep only schedule parameters; never persist an autologin token.
  const result = new URL(u.origin + u.pathname);
  for (const key of ['type', 'laererid', 'elevid']) {
    if (u.searchParams.has(key)) result.searchParams.set(key, u.searchParams.get(key));
  }
  if (!/^\d{2}20\d{2}$/.test(week) || +week.slice(0, 2) < 1 || +week.slice(0, 2) > 53) {
    throw new Error('Ugen skal være mellem 01 og 53, med et år mellem 2000 og 2099.');
  }
  result.searchParams.set('week', week);
  return result.href;
}

export function parseBricks(bricks, source) {
  const events = new Map();
  const warnings = [];
  const pad = v => String(v).padStart(2, '0');
  const date = (d, m, y) => {
    const parsed = new Date(Date.UTC(+y, +m - 1, +d));
    if (parsed.getUTCFullYear() !== +y || parsed.getUTCMonth() !== +m - 1 || parsed.getUTCDate() !== +d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  };
  for (const b of bricks) {
    const raw = b.title || b.text;
    // Lectio tooltip: dd/mm-yyyy hh:mm til hh:mm (optionally a second date).
    const m = raw.match(/(\d{1,2})[/.](\d{1,2})[-/.](\d{4})\s+(\d{1,2}):([0-5]\d)\s*(?:til|[-–])\s*(?:(\d{1,2})[/.](\d{1,2})[-/.](\d{4})\s+)?(\d{1,2}):([0-5]\d)/i);
    const allDayMatch = raw.match(/(\d{1,2})[/.](\d{1,2})[-/.](\d{4})\s+Hele dagen/i);
    if (!m && !allDayMatch) { warnings.push('En skemabrik kunne ikke læses: ' + (b.text || 'uden titel')); continue; }
    const allDay = !m && Boolean(allDayMatch);
    const parts = m || allDayMatch;
    const startDate = date(parts[1], parts[2], parts[3]);
    let endDate = m?.[6] ? date(m[6], m[7], m[8]) : startDate;
    if (allDay && startDate) {
      const next = new Date(`${startDate}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      endDate = next.toISOString().slice(0, 10);
    }
    const start = `${startDate}T${allDay ? '00:00' : `${pad(m[4])}:${m[5]}`}:00`;
    const end = `${endDate}T${allDay ? '00:00' : `${pad(m[9])}:${m[10]}`}:00`;
    if (!startDate || !endDate || (!allDay && (+m[4] > 23 || +m[9] > 23)) || end <= start) {
      warnings.push('En skemabrik har en ukendt dato eller et ugyldigt tidsrum.'); continue;
    }
    const field = name => cleanField(raw.match(new RegExp(`(?:^|\\n)\\s*${name}\\s*:\\s*([^\\n]+)`, 'i'))?.[1]);
    let activityId = '';
    try { activityId = new URL(b.href, source).searchParams.get('absid') || ''; } catch {}
    // Current Lectio tooltips begin with an activity title; older ones begin with "Tid:".
    const firstLine = cleanField(raw.split('\n')[0]);
    const tooltipTitle = !/^(?:Tid\s*:|\d{1,2}[/.]\d{1,2}[-/.]\d{4})/i.test(firstLine) ? firstLine : '';
    const title = tooltipTitle || cleanField(b.text.split('\n').filter(Boolean).join(' · ')) || field('Titel') || field('Hold') || 'Aktivitet';
    const id = activityId ? `${activityId}:${start}` : `${start}:${end}:${title}`;
    events.set(id, {
      id, activityId: activityId || null, title, start, end, allDay, timeZone: 'Europe/Copenhagen',
      group: field('Hold'), teacher: field('Lærer(?:e)?'), room: field('Lokale(?:r)?'),
      cancelled: /cancel/i.test(b.classes) || /^aflyst!?$/i.test(firstLine),
      changed: /changed/i.test(b.classes) || /^ændret!?$/i.test(firstLine)
    });
  }
  return { events: [...events.values()].sort((a, b) => a.start.localeCompare(b.start)), warnings };
}

function cleanField(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
