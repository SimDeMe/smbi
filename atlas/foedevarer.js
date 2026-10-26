// Fødevarer og sult for ét eller to lande: nøgletal, største afgrøder og
// udvikling over tid.
// Data: FAO (underernæring, kalorieforsyning, kornudbytte, afgrøder) og UNICEF/WHO/
// Verdensbanken (væksthæmning). Dannes af data/foedevarer.py; kilder i
// data/foedevarer.LICENSE. Samme tal som temakortene under «Fødevarer og sult».
import { lavInformation } from './information.js';

let data;
export async function hentFoedevarer() {
  if (!data) {
    data = fetch(new URL('./data/foedevarer.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
      .then(svar => { if (!svar.ok) throw new Error('Fødevaredata kunne ikke hentes'); return svar.json(); })
      .then(d => { if (!d?.lande?.['208']?.k || !d.afgroeder || !Array.isArray(d.uaar) || !Array.isArray(d.kaar)) throw new Error('Ugyldige fødevaredata'); return d; })
      .catch(fejl => { data = null; throw fejl; });
  }
  return data;
}

const SVG = 'http://www.w3.org/2000/svg';
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
// FAO angiver underernæring under 2,5 % som 2,5.
export const procent = v => v <= 2.5 ? 'under 2,5 %' : `${fmt(v)} %`;
const figurbredde = (rum, maks = 560) => Math.round(Math.max(300, Math.min(maks, rum.clientWidth || maks)));

function raekker(land, verden) {
  const aar = par => par ? ` (${par[1]})` : '';
  return [
    ['Underernæring', land?.u ? procent(land.u[0]) : '–',
      `af befolkningen får for lidt energi${aar(land?.u)} · verden ${procent(verden.u[0])}`],
    ['Kalorieforsyning', land?.k ? `${land.k[0].toLocaleString('da-DK')} kcal` : '–',
      `pr. person pr. døgn${aar(land?.k)} · verden ${verden.k[0].toLocaleString('da-DK')}`],
    ['Væksthæmmede børn', land?.v ? `${fmt(land.v[0])} %` : '–',
      `af børn under 5 år er for lave til alderen${aar(land?.v)} · verden ${fmt(verden.v[0])} %`],
    ['Kornudbytte', land?.c != null ? `${fmt(land.c)} t/ha` : '–',
      land?.cl ? 'under 10.000 ha korn – for lidt til et sammenligneligt tal'
        : `ton korn pr. hektar, gns. 2022–2024 · verden ${fmt(verden.c)}`]
  ];
}

function noegletal(land, verden) {
  const liste = element('dl', null, 'noegletal');
  for (const [navn, vaerdi, forklaring] of raekker(land, verden)) {
    const kort = element('div');
    kort.append(element('dt', navn), element('dd', vaerdi, 'vaerdi'), element('dd', forklaring, 'forklaring'));
    liste.append(kort);
  }
  return liste;
}

// Kurve over tid med verdensgennemsnittet stiplet. Huller i serien bryder kurven.
// Under 2,5 % tegnes som 2,5 og forklares under figuren.
function lavKurve({ serie, verden, aarliste, navn, enhed, trin, min = 0, maks, B, landnavn }) {
  const H = B < 420 ? 198 : 218, v = 44, h = 14, top = 24, bund = 30;
  const alle = [...serie, ...verden].filter(t => t != null);
  const loft = maks ?? Math.ceil(Math.max(trin, ...alle) / trin) * trin;
  const fra = aarliste[0], til = aarliste[aarliste.length - 1];
  const x = aar => v + (aar - fra) / (til - fra) * (B - v - h);
  const y = val => top + (1 - (val - min) / (loft - min)) * (H - top - bund);
  const sidste = serie.findLastIndex(t => t != null);
  const figur = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'transition foedekurve', role: 'img',
    'aria-label': `${navn} ${fra}–${til} for ${landnavn} i ${enhed}${sidste >= 0 ? `, senest ${fmt(serie[sidste], enhed === '%' ? 1 : 0)} i ${aarliste[sidste]}` : ''}. Stiplet: verdensgennemsnittet.` });
  for (let val = min; val <= loft + 1e-9; val += trin) {
    figur.append(svg('line', { x1: v, x2: B - h, y1: y(val), y2: y(val), class: val > min ? 'hjaelpelinje' : 'akse' }),
      svg('text', { x: v - 6, y: y(val) + 4, 'text-anchor': 'end', class: 'aksetal' }, val.toLocaleString('da-DK')));
  }
  const spring = (til - fra) > 40 ? (B < 420 ? 20 : 10) : (B < 420 ? 10 : 5);
  for (let aar = Math.ceil(fra / spring) * spring; aar <= til; aar += spring) {
    figur.append(svg('text', { x: x(aar), y: H - bund + 16, 'text-anchor': 'middle', class: 'aksetal' }, `${aar}`));
  }
  figur.append(svg('text', { x: 4, y: top - 10, class: 'aksetal' }, enhed));
  const stykker = s => {
    const ud = []; let nu = [];
    s.forEach((t, i) => { if (t == null) { if (nu.length) ud.push(nu); nu = []; } else nu.push(`${x(aarliste[i])},${y(t)}`); });
    if (nu.length) ud.push(nu);
    return ud;
  };
  for (const s of stykker(verden)) figur.append(svg('polyline', { points: s.join(' '), class: 'cdr fremskrevet' }));
  for (const s of stykker(serie)) {
    if (s.length === 1) { const [px, py] = s[0].split(','); figur.append(svg('circle', { cx: px, cy: py, r: 3, class: 'punkt' })); }
    else figur.append(svg('polyline', { points: s.join(' '), class: 'cbr' }));
  }
  return figur;
}

function kurver(rum, land, verden, d, landnavn, faelles) {
  const B = figurbredde(rum, 820);
  const ud = [];
  if (land?.us?.some(t => t != null)) {
    const fig = element('figure', null, 'foedefigur');
    fig.append(element('figcaption', 'Underernæring 2001–2024'),
      lavKurve({ serie: land.us, verden: verden.us, aarliste: d.uaar, navn: 'Underernæring', enhed: '%', trin: 10, maks: faelles?.u, B, landnavn }));
    ud.push(fig);
  }
  if (land?.ks?.some(t => t != null)) {
    const fig = element('figure', null, 'foedefigur');
    fig.append(element('figcaption', 'Kalorieforsyning 1961–2023'),
      lavKurve({ serie: land.ks, verden: verden.ks, aarliste: d.kaar, navn: 'Kalorieforsyning', enhed: 'kcal', trin: 500, min: 1000, maks: faelles?.k, B, landnavn }));
    ud.push(fig);
  }
  if (!ud.length) ud.push(element('p', 'FAO har ingen tidsserie for dette land.', 'antal'));
  return ud;
}

// Største afgrøder efter høstet areal: søjle for andelen af landets samlede
// høstede areal, og areal og produktion som tal.
const maengde = (t, enhed) => t >= 1e6 ? `${fmt(t / 1e6, t >= 1e8 ? 0 : 1)} mio. ${enhed}`
  : t >= 1e4 ? `${Math.round(t / 1e3).toLocaleString('da-DK')}.000 ${enhed}` : `${Math.round(t).toLocaleString('da-DK')} ${enhed}`;
function afgroedeliste(land, d) {
  if (!land?.a?.length) return element('p', 'FAOSTAT har ingen afgrødetal for dette område.', 'antal');
  const liste = element('ol', null, 'afgroeder');
  for (const [kode, areal, prod] of land.a) {
    const andel = 100 * areal / land.at;
    const li = element('li');
    const navn = element('span', d.afgroeder[kode] ?? `FAO-vare ${kode}`, 'afgroedenavn');
    const tal = element('span', `${andel < 1 ? fmt(andel) : Math.round(andel)} %`, 'afgroedeandel');
    const soejle = element('span', null, 'afgroedesoejle');
    soejle.append(element('span'));
    soejle.firstChild.style.width = `${Math.max(1, andel).toFixed(1)}%`;
    soejle.setAttribute('aria-hidden', 'true');
    li.append(navn, tal, soejle,
      element('span', `areal ${maengde(areal, 'ha')}${prod != null ? ` · høst ${maengde(prod, 't')}` : ''}`, 'forklaring'));
    liste.append(li);
  }
  return liste;
}
function afgroededel(land, d, id) {
  const del = element('section', null, 'afgroededel');
  const t = element('h3', 'Største afgrøder', 'figurtitel'); t.id = id;
  del.setAttribute('aria-labelledby', t.id);
  del.append(t, afgroedeliste(land, d));
  return del;
}
const AFGROEDENOTE = d => `Andel af landets samlede høstede areal, gns. ${d.afgroedeaar[0]}–${d.afgroedeaar.at(-1)} (FAOSTAT). ` +
  `Græs, kløver og andre foderafgrøder er ikke med. Verden: ${d.lande.verden.a.slice(0, 3).map(a => d.afgroeder[a[0]].toLowerCase()).join(', ')}.`;

const NOTE = 'Fuldt optrukket: landet. Stiplet: verdensgennemsnittet. På underernæringskurven betyder 2,5 % «under 2,5 %».';

const OM = d => lavInformation({
  navn: 'fødevaredata', overskrift: 'Om data',
  introduktion: 'FAO’s skøn over underernæring og kalorieforsyning, FAO’s kornudbytte og afgrøder og UNICEF/WHO/Verdensbankens tal for væksthæmning.',
  tekst: 'Underernæring: FAO, Prevalence of undernourishment, via Verdensbanken (SN.ITK.DEFC.ZS). Andelen af befolkningen, hvis sædvanlige fødeindtag ikke dækker energibehovet til et normalt aktivt og sundt liv. Det er et modelberegnet skøn ud fra kalorieforsyningen, hvor ulige maden er fordelt, og befolkningens energibehov – ikke en optælling af sultne. Under 2,5 % angives ikke præcist. ' +
    'Kalorieforsyning: FAO, Food Balances, via Our World in Data. Den energi, der er til rådighed som mad i landet (produktion plus import minus eksport, foder, udsæd og svind), delt med indbyggerne. Det er udbuddet, ikke det, folk faktisk spiser; madspild i husholdningerne og ulighed er ikke trukket fra, så et land kan have nok kalorier i gennemsnit og alligevel mange sultne. Brud i kurven betyder manglende tal, fx efter at et land er delt eller dannet. ' +
    'Væksthæmning: UNICEF, WHO og Verdensbanken, Joint Child Malnutrition Estimates, modelestimat (SH.STA.STNT.ME.ZS). Børn under 5 år, der er mere end to standardafvigelser lavere end WHO’s vækststandard for alderen – et tegn på langvarig fejlernæring og sygdom, ikke kun for lidt mad. ' +
    'Kornudbytte: FAO (FAOSTAT) via Verdensbanken (AG.YLD.CREL.KG). Høstet korn pr. hektar høstet areal, gennemsnit af 2022–2024, fordi udbyttet svinger meget med vejret. Lande med under 10.000 ha korn (fx Djibouti og golfstaterne) er udeladt, fordi udbyttet fra få, ofte kunstvandede marker ikke kan sammenlignes med et landbrugslands. ' +
    'Største afgrøder: FAOSTAT, Crops and livestock products (QCL). De seks primærafgrøder med størst høstet areal, gennemsnit af 2022–2024, og deres andel af det samlede høstede areal for alle primærafgrøder. Høstes en mark to gange om året, tælles den to gange. Græs, kløver, foderroer og andre foderafgrøder indgår ikke i FAOSTAT’s afgrødetal, så i lande med meget kvægbrug (fx Danmark og Irland) er en stor del af landbrugsjorden ikke med. «Andre grøntsager», «andre frugter» o.l. er FAO’s samlegrupper for afgrøder, landet ikke opgør hver for sig; i Etiopien og Eritrea er FAO’s «andet korn» især teff. Produktionen er i ton høstet vare og afhænger af vandindholdet – sukkerrør og kassava vejer meget, korn og bønner lidt – så den egner sig ikke til at sammenligne afgrøder med hinanden. ' +
    'Alle tal er landsgennemsnit; forskelle mellem egne, by og land og rig og fattig ses ikke. Licens: CC BY 4.0. Grænser og navne er ikke en stillingtagen til omstridte områder.'
});

export function visFoedevarer(rod, land, d, landnavn) {
  rod.replaceChildren();
  const verden = d.lande.verden;
  const tal = element('section', null, 'demografi-tal');
  const tt = element('h3', 'Fødevarer og sult', 'figurtitel'); tt.id = 'foedetitel';
  tal.setAttribute('aria-labelledby', tt.id);
  tal.append(tt, noegletal(land, verden));
  if (!land) tal.append(element('p', 'FAO og UNICEF/WHO har ingen fødevaretal for dette område.', 'figurnote'));
  const afgroeder = afgroededel(land, d, 'foedeafgroeder');
  afgroeder.append(element('p', AFGROEDENOTE(d), 'figurnote'));
  const forloeb = element('section', null, 'demografi-forloeb');
  const ft = element('h3', 'Udvikling over tid', 'figurtitel'); ft.id = 'foedeforloeb';
  forloeb.setAttribute('aria-labelledby', ft.id);
  const plads = element('div', null, 'foedekurver');
  forloeb.append(ft, plads, element('p', NOTE, 'figurnote'));

  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const spoergsmaal = element('ol', null, 'opgaveliste');
  for (const s of [
    'Er kalorieforsyningen over eller under verdensgennemsnittet? Er der alligevel underernærede? Forklar, hvordan begge dele kan være sandt på én gang.',
    'Følg underernæringen fra 2001 til i dag. Find år, hvor kurven knækker, og undersøg, om tørke, konflikt eller priskriser kan forklare det.',
    'Hvorfor kan andelen af væksthæmmede børn være høj, selvom underernæringen er lav? Tænk på kostens sammensætning, sygdom og rent vand.',
    'Se på de største afgrøder. Er det mest korn, rod- og knoldfrugter eller eksportafgrøder som kaffe, kakao og soja? Hvad siger det om klimaet, og om hvem afgrøderne dyrkes til?',
    'Sammenlign kornudbyttet med Danmark. Hvilke naturforhold (nedbør, regntidens længde, jordbund) og hvilke samfundsforhold (gødning, vanding, sorter, ejerskab) kan forklare forskellen?',
    'Skift til Demografi-fanen. Hvordan påvirker befolkningsvæksten den fødevareproduktion, landet skal nå i 2050?'
  ]) spoergsmaal.append(element('li', s));
  undersoeg.append(spoergsmaal);

  rod.append(element('div', null, 'demografi-gitter foede-gitter'));
  rod.firstChild.append(tal, afgroeder, forloeb);
  rod.append(undersoeg, OM(d));
  plads.append(...kurver(plads, land, verden, d, landnavn));
}

// To lande side om side med samme skala; nøgletallene i én tabel.
export function visFoedevarerSammenligning(rod, lande, d) {
  rod.replaceChildren();
  const verden = d.lande.verden;
  const tabel = element('table', null, 'sammenligningstabel');
  tabel.append(element('caption', 'Fødevarer og sult'));
  const hoved = element('tr');
  const tom = element('th', 'Nøgletal'); tom.scope = 'col'; hoved.append(tom);
  for (const l of lande) { const th = element('th', l.navn); th.scope = 'col'; hoved.append(th); }
  const thead = element('thead'); thead.append(hoved); tabel.append(thead);
  const krop = element('tbody');
  const alle = lande.map(l => raekker(l.data, verden));
  alle[0].forEach(([navn], r) => {
    const tr = element('tr');
    const th = element('th'); th.scope = 'row';
    th.append(element('span', navn, 'noeglenavn'));
    tr.append(th);
    for (const rk of alle) {
      const td = element('td');
      td.append(element('span', rk[r][1], 'vaerdi'), element('span', rk[r][2], 'forklaring'));
      tr.append(td);
    }
    krop.append(tr);
  });
  tabel.append(krop);
  const taldel = element('section', null, 'sammenligning-tal');
  const tt = element('h3', 'Fødevarer og sult', 'figurtitel'); tt.id = 'foedesammenligning';
  taldel.setAttribute('aria-labelledby', tt.id);
  const rulle = element('div', null, 'tabelrulle'); rulle.append(tabel);
  taldel.append(tt, rulle);

  // Fælles loft, så kurverne kan sammenlignes direkte.
  const loft = (felt, trin) => Math.ceil(Math.max(trin, ...lande.flatMap(l => l.data?.[felt] || []).filter(t => t != null), ...verden[felt]) / trin) * trin;
  const faelles = { u: loft('us', 10), k: loft('ks', 500) };
  const forloeb = element('div', null, 'sammenligning-par');
  const kolonner = lande.map(l => {
    const kolonne = element('div', null, 'sammenligning-kolonne');
    kolonne.append(element('h4', l.navn, 'landenavn'));
    forloeb.append(kolonne);
    return kolonne;
  });
  const forloebsdel = element('section', null, 'sammenligning-forloeb');
  const ft = element('h3', 'Udvikling over tid', 'figurtitel'); ft.id = 'foedesammenligningforloeb';
  forloebsdel.setAttribute('aria-labelledby', ft.id);
  forloebsdel.append(ft, forloeb, element('p', `Samme skala for begge lande. ${NOTE}`, 'figurnote'));
  const afgroedepar = element('div', null, 'sammenligning-par');
  for (const l of lande) {
    const kolonne = element('div', null, 'sammenligning-kolonne');
    kolonne.append(element('h4', l.navn, 'landenavn'), afgroedeliste(l.data, d));
    afgroedepar.append(kolonne);
  }
  const afgroededelen = element('section', null, 'sammenligning-forloeb');
  const at = element('h3', 'Største afgrøder', 'figurtitel'); at.id = 'foedesammenligningafgroeder';
  afgroededelen.setAttribute('aria-labelledby', at.id);
  afgroededelen.append(at, afgroedepar, element('p', AFGROEDENOTE(d), 'figurnote'));
  rod.append(taldel, afgroededelen, forloebsdel, OM(d));
  lande.forEach((l, i) => kolonner[i].append(...kurver(kolonner[i], l.data, verden, d, l.navn, faelles)));
}
