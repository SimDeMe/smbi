export function weeksForRange(from, to) {
  const valid = value => /^20\d{2}-\d{2}-\d{2}$/.test(value || '') && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(from) || !valid(to) || from > to) throw new Error('Vælg en gyldig start- og slutdato.');
  const start = new Date(from + 'T12:00:00Z');
  const end = new Date(to + 'T12:00:00Z');
  if ((end - start) / 86400000 > 370) throw new Error('Hent højst ét skoleår ad gangen.');
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  const weeks = [];
  for (const monday = start; monday <= end; monday.setUTCDate(monday.getUTCDate() + 7)) {
    const thursday = new Date(monday); thursday.setUTCDate(thursday.getUTCDate() + 3);
    const year = thursday.getUTCFullYear();
    const number = Math.ceil(((thursday - new Date(Date.UTC(year, 0, 1, 12))) / 86400000 + 1) / 7);
    weeks.push(String(number).padStart(2, '0') + year);
  }
  return weeks;
}

export function collectRange(batches, from, to) {
  const events = new Map();
  for (const batch of batches) for (const event of batch.events) {
    if (event.start.slice(0, 10) <= to && event.end > `${from}T00:00:00`) events.set(event.id, event);
  }
  return [...events.values()].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

export function updateRange(config, mode, today) {
  if (!['future', 'all'].includes(mode)) throw new Error('Vælg Opdater eller Opdater alt.');
  const from = mode === 'all' ? config.from : [config.from, today].sort().at(-1);
  if (from > config.to) throw new Error('Perioden ligger i fortiden. Brug Opdater alt.');
  return { from, to: config.to, weeks: weeksForRange(from, config.to) };
}

export function mergeUpdate(previous, batches, source, range, refreshFrom) {
  const compatible = previous && sameSource(previous.source, source);
  const history = compatible ? previous.events.filter(e => e.end <= `${refreshFrom}T00:00:00`) : [];
  return collectRange([{ events: history }, ...batches], range.from, range.to);
}

export function sameSource(a, b) {
  const identity = value => {
    const url = new URL(value); url.searchParams.delete('week'); url.searchParams.sort(); return url.href;
  };
  return identity(a) === identity(b);
}
