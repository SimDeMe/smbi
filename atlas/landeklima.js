import { hent as hentUdledning } from './udledning.js';
import { hent as hentSamfund, ENERGIKILDER } from './samfund.js';

const ELKILDER = {
  coal: 'Kul', gas: 'Gas', other_fossil: 'Øvrig fossil', nuclear: 'Atomkraft',
  hydro: 'Vandkraft', wind: 'Vind', solar: 'Sol', biofuel: 'Bioenergi', other_renewables: 'Øvrig vedvarende'
};
const FARVER = ['#3b3a37', '#aa501a', '#78644d', '#823aa2', '#1f638c', '#087669', '#966800', '#58732c', '#7c4767'];
const TAL = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 2 });
const format = n => Number.isFinite(n) ? TAL.format(n) : '–';
const hentFil = async navn => {
  const svar = await fetch(new URL(`./data/${navn}.json`, import.meta.url), { signal: AbortSignal.timeout(15000) });
  if (!svar.ok) throw new Error(navn);
  return svar.json();
};

let henter;
export function hentLandeklima() {
  henter ??= Promise.all([hentUdledning(), hentSamfund(), hentFil('elproduktion'), hentFil('landtemperatur'), hentFil('landhavniveau')])
    .catch(fejl => { henter = null; throw fejl; });
  return henter;
}

function element(type, tekst, klasse) {
  const node = document.createElement(type);
  if (tekst) node.textContent = tekst;
  if (klasse) node.className = klasse;
  return node;
}

function kilde(tekst, adresse) {
  const link = element('a', tekst);
  link.href = adresse;
  return link;
}

function kildeafsnit(...links) {
  const p = element('p', '', 'metadata');
  links.forEach((link, i) => p.append(i ? ' · ' : '', link));
  return p;
}

function knap(tekst, handling) {
  const b = element('button', tekst);
  b.type = 'button';
  b.onclick = handling;
  return b;
}

function svgElement(type, attributter, tekst) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', type);
  for (const [key, value] of Object.entries(attributter)) node.setAttribute(key, value);
  if (tekst) node.textContent = tekst;
  return node;
}

function tabel(aar, serier, enhed) {
  const detaljer = element('details', '', 'landeklima-tabel');
  detaljer.append(element('summary', `Se tal (${enhed})`));
  const t = element('table');
  const raekke = (tag, navn, tal) => {
    const r = element('tr');
    const h = element('th', navn);
    h.scope = tag === 'th' ? 'col' : 'row';
    r.append(h, ...tal.map(v => {
      const celle = element(tag, v);
      if (tag === 'th') celle.scope = 'col';
      return celle;
    }));
    return r;
  };
  t.createTHead().append(raekke('th', 'År', serier.map(s => s.navn)));
  t.createTBody().append(...aar.map((a, i) => raekke('td', String(a), serier.map(s => format(s.tal[i])))));
  const rullefelt = element('div', '', 'landeklima-tabelrul');
  rullefelt.tabIndex = 0;
  rullefelt.setAttribute('role', 'region');
  rullefelt.setAttribute('aria-label', `Tal i ${enhed}`);
  rullefelt.append(t);
  detaljer.append(rullefelt);
  return detaljer;
}

function graf(aar, serier, enhed, [min, max]) {
  serier = serier.filter(s => s.tal.some(Number.isFinite));
  if (!serier.length) return element('p', 'Ingen data i denne opgørelse.', 'metadata');
  const figur = element('figure', '', 'landeklima-graf');
  const svg = svgElement('svg', { viewBox: '0 0 400 169', 'aria-hidden': 'true' });
  const x = a => 53 + 317 * (a - aar[0]) / (aar.at(-1) - aar[0] || 1);
  const y = t => 139 - 116 * (t - min) / (max - min);
  svg.append(svgElement('text', { x: 53, y: 14 }, enhed));
  for (const i of [0, 1, 2, 3, 4]) {
    const t = min + i * (max - min) / 4;
    svg.append(svgElement('line', { x1: 53, x2: 370, y1: y(t), y2: y(t), stroke: '#c9c6bd' }),
      svgElement('text', { x: 48, y: y(t) + 4, 'text-anchor': 'end' }, format(t)));
  }
  aar.forEach((a, i) => {
    if (aar.length <= 5 || i === 0 || i === aar.length - 1 || (i < aar.length - 2 && i % 5 === 0)) {
      svg.append(svgElement('text', { x: x(a), y: 158, 'text-anchor': 'middle' }, String(a)));
    }
  });
  const signatur = element('ul', '', 'landeklima-signatur');
  for (const s of serier) {
    let sti = '';
    let forrige = false;
    const punkter = [];
    s.tal.forEach((v, i) => {
      if (Number.isFinite(v)) {
        sti += `${forrige ? 'L' : 'M'}${x(aar[i])} ${y(v)} `;
        punkter.push(svgElement('circle', { cx: x(aar[i]), cy: y(v), r: aar.length > 15 ? 1.5 : 2.5, fill: s.farve }));
      }
      forrige = Number.isFinite(v);
    });
    svg.append(svgElement('path', { d: sti, fill: 'none', stroke: s.farve, 'stroke-width': 2, 'stroke-dasharray': s.stiplet ? '5 3' : 'none' }), ...punkter);
    const punkt = element('li', s.navn);
    punkt.style.borderColor = s.farve;
    if (s.stiplet) punkt.style.borderStyle = 'dashed';
    signatur.append(punkt);
  }
  figur.append(svg, signatur, tabel(aar, serier, enhed));
  return figur;
}

function figurer(rum, lande, aar, serier, enhed, fastSkala) {
  const alle = lande.map(serier);
  const tal = alle.flat().flatMap(s => s.tal).filter(Number.isFinite);
  const min = Math.floor(Math.min(0, ...tal));
  const max = Math.ceil(Math.max(min + .01, ...tal));
  const grid = element('div', '', lande.length > 1 ? 'sammenligning-par' : '');
  lande.forEach((land, i) => {
    const kolonne = element('div');
    if (lande.length > 1) kolonne.append(element('h4', land.navn));
    kolonne.append(graf(aar, alle[i], enhed, fastSkala ?? [min, max]));
    grid.append(kolonne);
  });
  rum.replaceChildren(grid);
}

function afsnit(titel, intro) {
  const s = element('section', '', 'landeklima-afsnit');
  s.append(element('h3', titel), element('p', intro));
  return s;
}

function medVaelger(rum, navn, muligheder, tegn) {
  const label = element('label', navn, 'landeklima-vaelger');
  const felt = element('select');
  for (const [vaerdi, tekst] of muligheder) {
    const valg = element('option', tekst);
    valg.value = vaerdi;
    felt.append(valg);
  }
  label.append(felt);
  const figurrum = element('div');
  rum.append(label, figurrum);
  felt.onchange = () => tegn(figurrum, felt.value);
  felt.onchange();
}

export function visLandeklima(rum, lande, [ud, samfund, el, temperatur, hav], visLag) {
  const temperaturAar = temperatur.perioder.map(([fra]) => fra);
  const periode = temperatur.perioder.at(-1).join('–');
  const opvarmning = afsnit('Observeret opvarmning', `Temperaturafvigelse fra ${temperatur.grundlag}. Hvert punkt viser en periode. Den sidste dækker ${periode}.`);
  const temperaturFigurer = element('div');
  figurer(temperaturFigurer, lande, temperaturAar, ({ id }) => {
    const landetal = temperatur.lande[id];
    const tal = landetal ?? temperatur.lokale[id];
    return tal?.some(Number.isFinite) ? [
      { navn: landetal ? 'Landsgennemsnit' : 'Omkring landepunktet', tal, farve: '#a14326' },
      { navn: 'Verden', tal: temperatur.verden, farve: '#246587', stiplet: true }
    ] : [];
  }, '°C');
  opvarmning.append(temperaturFigurer, element('p', 'Landsgennemsnit kræver mindst tre centre i det samme 2°-gitter som kortlaget. For mindre lande vises i stedet området omkring atlasets landepunkt. Gitteret er udglattet og bygger på temperaturer over både land og hav.', 'metadata'),
    knap('Vis temperaturstigning på globussen', () => visLag('temperaturlag')),
    kildeafsnit(kilde('NASA GISTEMP v4', 'https://data.giss.nasa.gov/gistemp/')));

  const udledning = afsnit('Landets udledninger', 'CO₂ fra fossile brændsler og industri. Forbrugsopgørelsen medregner udledninger fra import og trækker udledninger fra eksport fra.');
  medVaelger(udledning, 'Vis udledning', [['alt', 'I alt'], ['pr', 'Pr. indbygger']], (felt, maal) => {
    const pr = maal === 'pr';
    figurer(felt, lande, ud.aar, ({ id }) => [
      { navn: 'National', tal: ud.lande[id]?.[pr ? 'nc' : 'n'] ?? [], farve: '#a14326' },
      { navn: 'Forbrugsbaseret', tal: ud.lande[id]?.[pr ? 'fc' : 'f'] ?? [], farve: '#246587', stiplet: true }
    ], pr ? 't CO₂ pr. indbygger' : 'mio. t CO₂');
  });
  for (const { id, navn } of lande) {
    const senest = ud.aar.at(-1);
    const historisk = ud.kumuleret.lande[id]?.k.at(-1);
    const ghg = ud.lande[id]?.g.at(-1);
    udledning.append(element('p', `${navn} · CO₂ fra fossile brændsler og industri siden ${ud.kumuleret.fra} til ${senest}: ${format(historisk)} mio. t. Alle drivhusgasser inkl. arealanvendelse i ${senest}: ${format(ghg)} mio. t CO₂-ækv.`, 'metadata'));
  }
  udledning.append(kildeafsnit(kilde(ud.kilde, 'https://github.com/owid/co2-data')));

  const energi = afsnit('Energi og grøn omstilling', 'El produceret i landet. Skift mellem mængde og andel for at se, om fossil elproduktion falder, når vind og sol vokser.');
  const sidste = Math.max(2000, ...lande.flatMap(({ id }) => Object.keys(el.lande[id] ?? {}).map(Number)));
  const elaar = Array.from({ length: sidste - 1999 }, (_, i) => 2000 + i);
  medVaelger(energi, 'Vis elproduktion', [['twh', 'TWh'], ['andel', 'Andel (%)']], (felt, maal) => {
    const andel = maal === 'andel';
    const serier = [['fossil', 'Fossil i alt'], ...Object.entries(ELKILDER)];
    figurer(felt, lande, elaar, ({ id }) => serier.map(([kode, navn], i) => ({
      navn, farve: i ? FARVER[i - 1] : '#171c1b', stiplet: !i,
      tal: elaar.map(aar => {
        const raekke = el.lande[id]?.[aar];
        const tal = raekke?.[kode];
        if (!andel) return tal;
        return Number.isFinite(tal) && raekke.total > 0 ? 100 * tal / raekke.total : null;
      })
    })), andel ? '%' : 'TWh', andel ? [0, 100] : null);
  });
  const prim = element('details');
  prim.append(element('summary', `Primærenergimiks i ${samfund.energiaar}`),
    element('p', 'Primærenergi dækker også energi til fx transport, varme og industri. Opgjort med substitutionsmetoden, uden traditionel biomasse.', 'metadata'));
  const miksGrid = element('div', '', lande.length > 1 ? 'sammenligning-par' : '');
  for (const { id, navn } of lande) {
    const kolonne = element('div');
    const miks = samfund.lande[id]?.energi;
    if (lande.length > 1) kolonne.append(element('h4', navn));
    const hovedgrupper = ['coal', 'oil', 'gas', 'nuclear', 'renewables']
      .filter(k => Number.isFinite(miks?.[k]));
    if (hovedgrupper.length) {
      const liste = element('ul', '', 'landeklima-miks');
      for (const k of hovedgrupper) {
        const punkt = element('li');
        const bar = element('meter');
        bar.min = 0; bar.max = 100; bar.value = miks[k];
        bar.setAttribute('aria-hidden', 'true');
        punkt.append(element('span', ENERGIKILDER[k]), bar, element('span', `${format(miks[k])} %`));
        liste.append(punkt);
      }
      kolonne.append(liste);
    } else {
      kolonne.append(element('p', 'Ingen primærenergidata.', 'metadata'));
    }
    miksGrid.append(kolonne);
  }
  prim.append(miksGrid);
  energi.append(prim, knap('Vis sol og vindpotentiale på globussen', () => visLag('potentialelag')),
    kildeafsnit(kilde('Ember · elproduktion (CC BY 4.0)', 'https://ember-energy.org/data/yearly-electricity-data/'),
      kilde('Our World in Data · primærenergi', 'https://github.com/owid/energy-data')));

  const risiko = afsnit('Klimafarer og konsekvenser', 'Undersøg, hvor mere ekstrem varme, kraftig nedbør og stigende havniveau kan ramme befolkning og landbrug. Brug IPCC’s regionale fremskrivninger sammen med atlasets kort.');
  const kyst = element('details');
  kyst.append(element('summary', 'Målt havniveau ved kysten'), element('p', 'Vandstandens ændring i forhold til land ved stationen. Måleperioderne varierer.', 'metadata'));
  for (const { id, navn } of lande) {
    const stationer = hav.lande[id];
    kyst.append(element('h4', navn));
    if (!stationer?.length) {
      kyst.append(element('p', 'Ingen kyststationer i atlasets udvalg.', 'metadata'));
      continue;
    }
    const liste = element('ul');
    for (const s of stationer) liste.append(element('li', `${s.navn} · ${format(s.mm)} mm/år (${s.fra}–${s.til})`));
    kyst.append(liste);
  }
  risiko.append(kyst, knap('Vis vandstandsmålere på globussen', () => visLag('havniveaulag')),
    kildeafsnit(kilde('PSMSL · målte vandstande', 'https://psmsl.org/data/obtaining/'),
      kilde('IPCC · regionale klimafremskrivninger', 'https://interactive-atlas.ipcc.ch/'),
      kilde('IPCC · konsekvenser og tilpasning', 'https://www.ipcc.ch/report/ar6/wg2/about/factsheets/'),
      kilde('NASA · IPCC’s havniveaufremskrivninger', 'https://sealevel.nasa.gov/data_tools/17/')));
  rum.replaceChildren(opvarmning, udledning, energi, risiko);
}
