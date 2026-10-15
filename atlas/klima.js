// Hydrotermfigurer for udvalgte klimastationer i et land.
// Data: WMO-klimanormaler via Deutscher Wetterdienst (CLIMAT multi_annual).
// Dannes af data/lande.mjs; hentes først, når fanen åbnes.
import { lavInformation } from './information.js';

let data;
export async function hentKlima() {
  if (!data) {
    data = fetch(new URL('./data/klima.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
      .then(svar => { if (!svar.ok) throw new Error('Klimadata kunne ikke hentes'); return svar.json(); })
      .catch(fejl => { data = null; throw fejl; });
  }
  return data;
}

const SVG = 'http://www.w3.org/2000/svg';
const MAANEDER = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MAANEDNAVNE = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
function svg(type, egenskaber = {}, tekst) {
  const el = document.createElementNS(SVG, type);
  for (const [k, v] of Object.entries(egenskaber)) el.setAttribute(k, v);
  if (tekst != null) el.textContent = tekst;
  return el;
}
function element(type, tekst, klasse) {
  const el = document.createElement(type);
  if (tekst != null) el.textContent = tekst;
  if (klasse) el.className = klasse;
  return el;
}
const fmt = (v, d = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
const grader = (v, pos, neg) => `${fmt(Math.abs(v), 2)}° ${v < 0 ? neg : pos}`;

// Hydrotermfigur med den gængse skala 10 °C ≙ 20 mm: hvor temperaturkurven
// ligger over nedbørssøjlen, er måneden tør (fordampningen kan overstige nedbøren).
export function lavHydrotermfigur(station) {
  const { t, n } = station;
  const B = 340, H = 250, v = 40, h = 38, top = 26, bund = 26;
  const tMin = Math.min(0, Math.floor(Math.min(...t) / 10) * 10);
  const tMax = Math.max(20, Math.ceil(Math.max(...t) / 10) * 10, Math.ceil(Math.max(...n) / 20) * 10);
  const yT = val => top + (tMax - val) / (tMax - tMin) * (H - top - bund);
  const yN = mm => yT(mm / 2);
  const bredde = (B - v - h) / 12;
  const x = i => v + (i + .5) * bredde;
  const figur = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'hydroterm', role: 'img',
    'aria-label': `Hydrotermfigur for ${station.navn}: nedbør som søjler og temperatur som kurve for hver måned. Tabellen under figuren har tallene.` });
  const toerre = t.map((tv, i) => 2 * tv > n[i]);
  toerre.forEach((tor, i) => { if (tor) figur.append(svg('rect', { x: v + i * bredde, y: top, width: bredde, height: H - top - bund, class: 'toer' })); });
  // Temperaturaksen nummereres kun i et realistisk interval; over det følger
  // aksen blot nedbøren (fx 130 °C ved 260 mm i en våd station).
  const tEtiket = Math.max(30, Math.ceil(Math.max(...t) / 10) * 10);
  for (let val = tMin; val <= tMax; val += 10) {
    figur.append(svg('line', { x1: v, x2: B - h, y1: yT(val), y2: yT(val), class: val ? 'hjaelpelinje' : 'akse' }));
    if (val <= tEtiket) figur.append(svg('text', { x: B - h + 6, y: yT(val) + 4, class: 'aksetal temp-tal' }, `${val}`));
    if (val >= 0) figur.append(svg('text', { x: v - 6, y: yT(val) + 4, 'text-anchor': 'end', class: 'aksetal nedboer-tal' }, `${2 * val}`));
  }
  figur.append(svg('text', { x: v - 6, y: 11, 'text-anchor': 'end', class: 'aksetal nedboer-tal' }, 'mm'),
    svg('text', { x: B - h + 6, y: tEtiket < tMax ? yT(tEtiket) - 10 : 11, class: 'aksetal temp-tal' }, '°C'));
  n.forEach((mm, i) => figur.append(svg('rect', { x: x(i) - bredde * .36, y: yN(mm), width: bredde * .72, height: Math.max(yN(0) - yN(mm), .5), class: 'nedboer' })));
  figur.append(svg('polyline', { points: t.map((tv, i) => `${x(i)},${yT(tv)}`).join(' '), class: 'temperatur' }));
  t.forEach((tv, i) => figur.append(svg('circle', { cx: x(i), cy: yT(tv), r: 2.6, class: 'temperaturpunkt' })));
  MAANEDER.forEach((m, i) => figur.append(svg('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'aksetal' }, m)));
  return figur;
}

function stationskort(station, land) {
  const kort = element('article', null, 'stationskort');
  kort.append(element('h3', station.navn, 'figurtitel'));
  const [lon, lat] = station.punkt;
  const sted = [grader(lat, 'N', 'S'), grader(lon, 'Ø', 'V'), `${station.hoejde.toLocaleString('da-DK')} m o.h.`];
  if (station.omraade && station.omraade !== land) sted.unshift(station.omraade);
  kort.append(element('p', `${sted.join(' · ')} · WMO ${station.wmo}`, 'metadata'));
  if (station.periode !== '1991–2020') kort.append(element('p', `Normalperiode ${station.periode}. Nyere normal findes ikke i datasættet for stationen.`, 'periodeadvarsel'));
  kort.append(lavHydrotermfigur(station));
  const aarsmiddel = station.t.reduce((s, v) => s + v, 0) / 12;
  const aarsnedboer = station.n.reduce((s, v) => s + v, 0);
  const amplitude = Math.max(...station.t) - Math.min(...station.t);
  kort.append(element('p', `Årsmiddel ${fmt(aarsmiddel)} °C · årsnedbør ${Math.round(aarsnedboer).toLocaleString('da-DK')} mm · temperaturamplitude ${fmt(amplitude)} °C · ${station.periode}`, 'stationstal'));
  const toerre = station.t.map((tv, i) => 2 * tv > station.n[i]);
  const antalToerre = toerre.filter(Boolean).length;
  kort.append(element('p', antalToerre === 12 ? 'Alle tolv måneder er tørre (temperaturkurven over søjlen).'
    : antalToerre ? `Tørre måneder (temperaturkurven over søjlen): ${MAANEDNAVNE.filter((_, i) => toerre[i]).join(', ')}.`
      : 'Ingen tørre måneder efter hydrotermfigurens skala.', 'figurnote'));
  const detaljer = element('details', null, 'datatabel');
  detaljer.append(element('summary', 'Tal i tabel'));
  const t = element('table', null, 'pladetabel klimatabel');
  t.append(element('caption', `${station.navn}${station.omraade && station.omraade !== land ? ` (${station.omraade})` : ''}: klimanormal ${station.periode}`));
  const hoved = element('tr');
  for (const tekst of ['Måned', 'Temperatur (°C)', 'Nedbør (mm)']) { const th = element('th', tekst); th.scope = 'col'; hoved.append(th); }
  const thead = element('thead'); thead.append(hoved); t.append(thead);
  const krop = element('tbody');
  MAANEDNAVNE.forEach((m, i) => {
    const r = element('tr'), th = element('th', m); th.scope = 'row';
    r.append(th, element('td', fmt(station.t[i])), element('td', fmt(station.n[i])));
    krop.append(r);
  });
  t.append(krop); detaljer.append(t); kort.append(detaljer);
  return kort;
}

export function visKlima(rod, stationer, landenavn) {
  rod.replaceChildren();
  if (!stationer?.length) {
    rod.append(element('p', `Datasættet har ingen klimanormal fra en station i ${landenavn}. Det gælder især små ø- og bystater. Prøv et naboland.`));
  } else {
    const forklaring = element('div', null, 'klimaforklaring');
    forklaring.append(
      element('span', 'Søjler: nedbør (mm, venstre akse)', 'tegn-nedboer'),
      element('span', 'Kurve: temperatur (°C, højre akse)', 'tegn-temperatur'),
      element('span', 'Lys baggrund: tør måned', 'tegn-toer'));
    rod.append(forklaring);
    const gitter = element('div', null, 'stationsgitter');
    for (const s of stationer) gitter.append(stationskort(s, stationer[0].omraade));
    rod.append(gitter);
  }
  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const liste = element('ol', null, 'opgaveliste');
  for (const s of [
    'Aflæs årets varmeste og koldeste måned og den samlede nedbør. Hvor stor er temperaturamplituden?',
    'Hvilke måneder er tørre? Hvad betyder det for plantevækst og landbrug?',
    'Hvilken klimazone og hvilket plantebælte hører stationen til? Begrund med temperatur og nedbør.',
    'Har landet flere stationer: Forklar forskellene med breddegrad, højde over havet, afstand til havet eller vindsystemer.'
  ]) liste.append(element('li', s));
  undersoeg.append(liste);
  rod.append(undersoeg, lavInformation({
    navn: `klimadata for ${landenavn}`, overskrift: 'Om data',
    introduktion: 'Klimanormaler: gennemsnit for 30 år målt på vejrstationen – ikke aktuelt vejr.',
    tekst: 'Månedsmiddeltemperatur og månedsnedbør er WMO-klimanormaler, som landenes vejrtjenester har indberettet (CLIMAT-meldinger og WMO’s normalpublikationer). Data: Deutscher Wetterdienst (DWD), Climate Data Center, CLIMAT multi_annual, CC BY 4.0. Normalperioden er 1991–2020. Hvor en nyere normal mangler for alle landets stationer, vises 1961–1990, og det står ved figuren. Stationerne er valgt automatisk: først den station, der ligger nærmest hovedstaden, og for større lande op til tre ekstra stationer med mest forskelligt klima. Det er altså eksempler, ikke et gennemsnit for hele landet. Figuren bruger den gængse skala 10 °C ≙ 20 mm nedbør. Ligger temperaturkurven over nedbørssøjlen, regnes måneden som tør, fordi fordampningen kan være større end nedbøren. Stationsnavne er gengivet som i kilden.'
  }));
}
