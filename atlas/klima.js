// Hydrotermfigurer for udvalgte klimastationer i et land.
// Data: WMO-klimanormaler via Deutscher Wetterdienst (CLIMAT multi_annual).
// Dannes af data/lande.mjs; hentes først, når fanen åbnes.
import { lavInformation } from './information.js';
import { klasse } from './klimalag.js';

let data;
export async function hentKlima() {
  if (!data) {
    data = fetch(new URL('./data/klima.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
      .then(svar => { if (!svar.ok) throw new Error('Klimadata kunne ikke hentes'); return svar.json(); })
      .catch(fejl => { data = null; throw fejl; });
  }
  return data;
}

// Klimaklassernes arealandel pr. land (Vahl og Köppen), fra klimalagets gitre.
// Dannes af data/klimazoner.py. Fejler hentningen, vises fanen uden.
let andele;
export async function hentKlimaandele() {
  if (!andele) {
    andele = fetch(new URL('./data/klimaandele.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
      .then(svar => { if (!svar.ok) throw new Error('Klimaandele kunne ikke hentes'); return svar.json(); })
      .catch(fejl => { andele = null; throw fejl; });
  }
  return andele;
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
// Aksernes yderpunkter for en eller flere stationer (fælles skala ved sammenligning).
export function hydrotermskala(stationer) {
  const t = stationer.flatMap(s => s.t), n = stationer.flatMap(s => s.n);
  return {
    tMin: Math.min(0, Math.floor(Math.min(...t) / 10) * 10),
    tMax: Math.max(20, Math.ceil(Math.max(...t) / 10) * 10, Math.ceil(Math.max(...n) / 20) * 10)
  };
}

export function lavHydrotermfigur(station, skala = hydrotermskala([station])) {
  const { t, n } = station;
  const B = 340, H = 250, v = 40, h = 38, top = 26, bund = 26;
  const { tMin, tMax } = skala;
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

function stationskort(station, land, skala, niveau = 'h3') {
  const kort = element('article', null, 'stationskort');
  kort.append(element(niveau, station.navn, 'figurtitel'));
  const [lon, lat] = station.punkt;
  const sted = [grader(lat, 'N', 'S'), grader(lon, 'Ø', 'V'), `${station.hoejde.toLocaleString('da-DK')} m o.h.`];
  if (station.omraade && station.omraade !== land) sted.unshift(station.omraade);
  kort.append(element('p', `${sted.join(' · ')} · WMO ${station.wmo}`, 'metadata'));
  if (station.periode !== '1991–2020') kort.append(element('p', `Normalperiode ${station.periode}. Nyere normal findes ikke i datasættet for stationen.`, 'periodeadvarsel'));
  kort.append(lavHydrotermfigur(station, skala));
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

// Hvor stor en del af landets areal hver klimaklasse dækker, med klimalagets
// farver. land: { vahl: [[nr, andel], …], koppen: […] } eller undefined.
export function lavKlimaandele(land, landenavn, niveau = 'h3') {
  if (!land?.vahl?.length && !land?.koppen?.length) return null;
  const boks = element('section', null, 'klimaandele');
  const overskrift = element(niveau, `Klimazoner i ${landenavn}`, 'figurtitel');
  boks.append(overskrift, element('p', 'Andel af landets areal i klimazonelaget (normaler 1991–2020). Klasser under 3 % er udeladt.', 'metadata'));
  const par = element('div', null, 'klimaandele-par');
  for (const [system, titel] of [['vahl', 'Vahl: zone og plantebælte'], ['koppen', 'Köppen-Geiger']]) {
    if (!land[system]?.length) continue;
    const kolonne = element('div');
    kolonne.append(element('p', titel, 'klimaandele-titel'));
    const liste = element('ul', null, 'klimaandele-liste');
    for (const [nr, andel] of land[system]) {
      const k = klasse(system, nr);
      if (!k) continue;
      const pct = Math.round(andel * 100);
      const li = element('li');
      const farve = element('span', null, 'klimaandele-farve');
      farve.style.background = k.farve;
      farve.setAttribute('aria-hidden', 'true');
      const navn = system === 'vahl' ? `${k.zone.replace(' zone', '')}: ${k.navn.toLowerCase()}` : `${k.navn} – ${k.forklaring}`;
      const soejle = element('span', null, 'klimaandele-soejle');
      soejle.style.setProperty('--andel', `${pct}%`);
      soejle.setAttribute('aria-hidden', 'true');
      li.append(farve, element('span', navn, 'klimaandele-navn'), element('span', `${pct} %`, 'klimaandele-tal'), soejle);
      liste.append(li);
    }
    kolonne.append(liste);
    par.append(kolonne);
  }
  boks.append(par);
  return boks;
}

export function visKlima(rod, stationer, landenavn, andele) {
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
  const zoner = lavKlimaandele(andele, landenavn);
  if (zoner) rod.append(zoner);
  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const liste = element('ol', null, 'opgaveliste');
  for (const s of [
    'Aflæs årets varmeste og koldeste måned og den samlede nedbør. Hvor stor er temperaturamplituden?',
    'Hvilke måneder er tørre? Hvad betyder det for plantevækst og landbrug?',
    'Hvilken klimazone og hvilket plantebælte hører stationen til? Begrund med temperatur og nedbør.',
    'Har landet flere stationer: Forklar forskellene med breddegrad, højde over havet, afstand til havet eller vindsystemer.',
    'Sammenlign dit svar med Klimazoner i landet. Ligger stationen i det plantebælte, der fylder mest? Hvorfor kan én station ikke vise hele landets klima?'
  ]) liste.append(element('li', s));
  undersoeg.append(liste);
  rod.append(undersoeg, lavInformation({
    navn: `klimadata for ${landenavn}`, overskrift: 'Om data',
    introduktion: 'Klimanormaler: gennemsnit for 30 år målt på vejrstationen – ikke aktuelt vejr.',
    tekst: 'Månedsmiddeltemperatur og månedsnedbør er WMO-klimanormaler, som landenes vejrtjenester har indberettet (CLIMAT-meldinger og WMO’s normalpublikationer). Data: Deutscher Wetterdienst (DWD), Climate Data Center, CLIMAT multi_annual, CC BY 4.0. Normalperioden er 1991–2020. Hvor en nyere normal mangler for alle landets stationer, vises 1961–1990, og det står ved figuren. Stationerne er valgt automatisk: først den station, der ligger nærmest hovedstaden, og for større lande op til tre ekstra stationer med mest forskelligt klima. Det er altså eksempler, ikke et gennemsnit for hele landet. Figuren bruger den gængse skala 10 °C ≙ 20 mm nedbør. Ligger temperaturkurven over nedbørssøjlen, regnes måneden som tør, fordi fordampningen kan være større end nedbøren. Stationsnavne er gengivet som i kilden.'
  }));
}

// To lande side om side. Alle figurer får samme skala, så søjler og kurver kan
// sammenlignes direkte. lande: [{ navn, stationer, andele }].
export function visKlimaSammenligning(rod, lande) {
  rod.replaceChildren();
  const alle = lande.flatMap(l => l.stationer || []);
  if (alle.length) {
    const forklaring = element('div', null, 'klimaforklaring');
    forklaring.append(
      element('span', 'Søjler: nedbør (mm, venstre akse)', 'tegn-nedboer'),
      element('span', 'Kurve: temperatur (°C, højre akse)', 'tegn-temperatur'),
      element('span', 'Lys baggrund: tør måned', 'tegn-toer'),
      element('span', 'Samme skala i alle figurer', 'tegn-skala'));
    rod.append(forklaring);
  }
  const skala = alle.length ? hydrotermskala(alle) : null;
  const par = element('div', null, 'sammenligning-par');
  lande.forEach((l, i) => {
    const kolonne = element('section', null, 'sammenligning-kolonne');
    const overskrift = element('h3', l.navn, 'landenavn'); overskrift.id = `klimaland${i}`;
    kolonne.setAttribute('aria-labelledby', overskrift.id);
    kolonne.append(overskrift);
    if (!l.stationer?.length) kolonne.append(element('p', `Datasættet har ingen klimanormal fra en station i ${l.navn}.`));
    else {
      const stak = element('div', null, 'stationsstak');
      for (const s of l.stationer) stak.append(stationskort(s, l.stationer[0].omraade, skala, 'h4'));
      kolonne.append(stak);
    }
    const zoner = lavKlimaandele(l.andele, l.navn, 'h4');
    if (zoner) kolonne.append(zoner);
    par.append(kolonne);
  });
  rod.append(par);
  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const liste = element('ol', null, 'opgaveliste');
  for (const s of [
    'Sammenlign årsmiddeltemperatur, årsnedbør og temperaturamplitude for de to landes hovedstationer.',
    'Hvilket land har flest tørre måneder? Hvornår på året falder nedbøren i hvert land?',
    'Hvilke klimazoner og plantebælter hører stationerne til? Forklar forskellen med breddegrad, højde, afstand til havet eller vindsystemer.',
    'Hvordan kan forskellene i klima påvirke landbrug og bosætning i de to lande?'
  ]) liste.append(element('li', s));
  undersoeg.append(liste);
  rod.append(undersoeg, lavInformation({
    navn: `klimadata for ${lande.map(l => l.navn).join(' og ')}`, overskrift: 'Om data',
    introduktion: 'Klimanormaler: gennemsnit for 30 år målt på vejrstationen – ikke aktuelt vejr.',
    tekst: 'Samme data som for ét land: WMO-klimanormaler via Deutscher Wetterdienst (DWD), CLIMAT multi_annual, CC BY 4.0, normalperiode 1991–2020 (ellers står perioden ved figuren). Ved sammenligning har alle figurer samme akser, så en høj søjle betyder det samme i begge lande. Figurer for tørre stationer kan derfor blive lave, når den anden station er meget våd. Stationerne er eksempler, ikke gennemsnit for landet.'
  }));
}
