// Demografi for ét land: befolkningspyramide, nøgletal og fødsels-/dødsrate.
// Data: FN World Population Prospects 2024 (mellemvariant), UNDP HDR 2025 og
// Verdensbanken. Dannes af data/lande.mjs; hentes først, når fanen åbnes.
import { lavInformation } from './information.js';

let data;
export async function hentDemografi() {
  if (!data) {
    data = fetch(new URL('./data/demografi.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
      .then(svar => { if (!svar.ok) throw new Error('Demografidata kunne ikke hentes'); return svar.json(); })
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
const fmt = (v, d = 1) => v == null ? '–' : v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
export function befolkningstekst(tusinder) {
  if (tusinder >= 1000) return `${fmt(tusinder / 1000, tusinder >= 100000 ? 0 : tusinder >= 10000 ? 1 : 2)} mio.`;
  return `${Math.round(tusinder * 1000).toLocaleString('da-DK')}`;
}

function aldersandele(p) {
  const sum = a => a.reduce((s, v) => s + v, 0);
  const i = (fra, til) => sum(p.maend.slice(fra, til)) + sum(p.kvinder.slice(fra, til));
  const alle = i(0, 21);
  return { boern: 100 * i(0, 3) / alle, voksne: 100 * i(3, 13) / alle, aeldre: 100 * i(13, 21) / alle, alle };
}

// Figurerne tegnes i den faktiske bredde, så teksten har læsbar størrelse også på mobil.
const figurbredde = (rum, maks = 560) => Math.round(Math.max(300, Math.min(maks, rum.clientWidth || maks)));

function lavPyramide(land, aar, maks, aldersgrupper, B) {
  const p = land.pyramide[aar];
  const total = aldersandele(p).alle;
  const H = B < 420 ? 330 : 360, midte = B / 2, halv = 36, top = 26, bund = 34;
  const raekke = (H - top - bund) / 21;
  const skala = (midte - halv - 12) / maks;
  const figur = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'pyramide', role: 'img',
    'aria-label': `Befolkningspyramide ${aar} for ${land.navn}: mænd til venstre, kvinder til højre, i procent af hele befolkningen` });
  figur.append(svg('text', { x: midte - halv - 4, y: 15, 'text-anchor': 'end', class: 'akseoverskrift' }, 'Mænd'),
    svg('text', { x: midte + halv + 4, y: 15, class: 'akseoverskrift' }, 'Kvinder'));
  // Lodrette hjælpelinjer for hver procent på x-aksen.
  const trin = maks > 6 || B < 420 ? 2 : 1;
  for (let v = 0; v <= maks + 1e-9; v += trin) {
    for (const side of [-1, 1]) {
      const x = midte + side * (halv + v * skala);
      figur.append(svg('line', { x1: x, x2: x, y1: top, y2: H - bund, class: v ? 'hjaelpelinje' : 'akse' }));
      if (side === 1 || v) figur.append(svg('text', { x, y: H - bund + 15, 'text-anchor': 'middle', class: 'aksetal' }, `${v}`));
    }
  }
  figur.append(svg('text', { x: midte, y: H - 4, 'text-anchor': 'middle', class: 'aksetal' }, 'Procent af hele befolkningen'));
  for (let i = 0; i < 21; i++) {
    const y = H - bund - (i + 1) * raekke;
    const m = 100 * p.maend[i] / total, k = 100 * p.kvinder[i] / total;
    figur.append(
      svg('rect', { x: midte - halv - m * skala, y: y + .6, width: Math.max(m * skala, .5), height: raekke - 1.2, class: 'maend' }),
      svg('rect', { x: midte + halv, y: y + .6, width: Math.max(k * skala, .5), height: raekke - 1.2, class: 'kvinder' }));
    if (i % 2 === 0 || raekke > 13) figur.append(svg('text', { x: midte, y: y + raekke / 2 + 4, 'text-anchor': 'middle', class: 'aldertal' }, aldersgrupper[i].replace('–', '-')));
  }
  return figur;
}

// fastMaks giver to lande samme lodrette skala ved sammenligning.
function lavTransition(land, serieaar, noegleaar, valgtAar, B, fastMaks) {
  const H = B < 420 ? 210 : 230, v = 34, h = 14, top = 14, bund = 32;
  const { cbr, cdr } = land.serie;
  const maks = fastMaks || transitionsmaks(land);
  const x = aar => v + (aar - 1950) / 150 * (B - v - h);
  const y = val => top + (1 - val / maks) * (H - top - bund);
  const figur = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'transition', role: 'img',
    'aria-label': `Fødselsrate og dødsrate 1950–2100 for ${land.navn} i promille. Efter ${noegleaar} er kurverne FN's fremskrivning.` });
  figur.append(svg('rect', { x: x(noegleaar), y: top, width: x(2100) - x(noegleaar), height: H - top - bund, class: 'fremskrivning' }),
    svg('text', { x: x(noegleaar) + 6, y: top + 13, class: 'aksetal' }, 'Fremskrivning →'));
  for (let val = 0; val <= maks; val += 10) {
    figur.append(svg('line', { x1: v, x2: B - h, y1: y(val), y2: y(val), class: val ? 'hjaelpelinje' : 'akse' }),
      svg('text', { x: v - 6, y: y(val) + 4, 'text-anchor': 'end', class: 'aksetal' }, `${val}`));
  }
  for (let aar = 1950; aar <= 2100; aar += B < 420 ? 50 : 25) figur.append(svg('text', { x: x(aar), y: H - bund + 16, 'text-anchor': 'middle', class: 'aksetal' }, `${aar}`));
  figur.append(svg('text', { x: 4, y: top - 2, class: 'aksetal' }, '‰'));
  // Naturlig tilvækst er afstanden mellem kurverne.
  const punkter = serie => serie.map((val, i) => `${x(serieaar[i])},${y(val)}`);
  figur.append(svg('polygon', { points: [...punkter(cbr), ...punkter(cdr).reverse()].join(' '), class: 'tilvaekst' }));
  const delSti = (serie, klasse) => {
    const i = serieaar.indexOf(noegleaar);
    figur.append(svg('polyline', { points: punkter(serie).slice(0, i + 1).join(' '), class: klasse }),
      svg('polyline', { points: punkter(serie).slice(i).join(' '), class: `${klasse} fremskrevet` }));
  };
  delSti(cbr, 'cbr'); delSti(cdr, 'cdr');
  // Navne ved kurvernes start, så farve ikke er eneste signal.
  const yf = y(cbr[0]), yd = y(cdr[0]);
  const afstand = Math.abs(yf - yd) < 14 ? 7 : 0;
  figur.append(svg('text', { x: x(1950) + 4, y: Math.min(yf, yd) === yf ? yf - 6 - afstand : yf + 14 + afstand, class: 'kurvenavn cbr-tekst' }, 'Fødselsrate'),
    svg('text', { x: x(1950) + 4, y: Math.min(yf, yd) === yd ? yd - 6 - afstand : yd + 14 + afstand, class: 'kurvenavn cdr-tekst' }, 'Dødsrate'));
  const markering = svg('line', { x1: x(valgtAar), x2: x(valgtAar), y1: top, y2: H - bund, class: 'valgtaar' });
  figur.append(markering);
  figur.markerAar = aar => { markering.setAttribute('x1', x(aar)); markering.setAttribute('x2', x(aar)); };
  return figur;
}

const transitionsmaks = land => Math.max(10, Math.ceil(Math.max(...land.serie.cbr, ...land.serie.cdr) / 10) * 10);
// Største aldersgruppe i procent over alle pyramideår: fast skala, så pyramiderne kan sammenlignes.
const pyramidemaks = (land, d) => Math.max(...d.pyramideaar.flatMap(aar => {
  const p = land.pyramide[aar], alle = aldersandele(p).alle;
  return [...p.maend, ...p.kvinder].map(v => 100 * v / alle);
}));

function noegletalraekker(land, d) {
  const n = land.noegletal;
  return [
    ['Befolkning', befolkningstekst(n.befolkning), `${d.noegleaar}`],
    ['Befolkningstilvækst', `${fmt(n.vaekst, 2)} %`, 'pr. år'],
    ['Fødselsrate', `${fmt(n.cbr)} ‰`, 'levendefødte pr. 1000 indbyggere pr. år'],
    ['Dødsrate', `${fmt(n.cdr)} ‰`, 'døde pr. 1000 indbyggere pr. år'],
    ['Samlet fertilitet', fmt(n.tfr, 2), 'børn pr. kvinde'],
    ['Spædbørnsdødelighed', `${fmt(n.spaedbarn)} ‰`, 'døde før 1 år pr. 1000 levendefødte'],
    ['Børnedødelighed', `${fmt(n.boern)} ‰`, 'døde før 5 år pr. 1000 levendefødte'],
    ['Middellevetid', `${fmt(n.levealder)} år`, `mænd ${fmt(n.levealderM)} · kvinder ${fmt(n.levealderK)}`],
    ['Medianalder', `${fmt(n.medianalder)} år`, 'halvdelen er yngre'],
    ['Nettomigration', `${fmt(n.migration)} ‰`, 'ind- minus udvandrede pr. 1000'],
    ['Befolkningstæthed', `${fmt(n.taethed, 0)}`, 'indbyggere pr. km²'],
    ['Byandel', n.byandel == null ? '–' : `${fmt(n.byandel)} %`, 'bor i byer (Verdensbanken)'],
    ['HDI', n.hdi == null ? '–' : fmt(n.hdi, 3), n.hdiRang ? `nr. ${n.hdiRang} af ${d.hdiAntal} lande` : 'ingen rangering'],
    ['BNI pr. indbygger', n.bni == null ? '–' : `${Math.round(n.bni).toLocaleString('da-DK')} $`, 'købekraftskorrigeret (PPP, 2021-$)'],
    ['Skolegang', n.skoleaar == null ? '–' : `${fmt(n.skoleaar)} år`, 'gns. for voksne over 25 år']
  ];
}

function noegletal(land, d) {
  const raekker = noegletalraekker(land, d);
  const liste = element('dl', null, 'noegletal');
  for (const [navn, vaerdi, forklaring] of raekker) {
    const kort = element('div');
    kort.append(element('dt', navn), element('dd', vaerdi, 'vaerdi'), element('dd', forklaring, 'forklaring'));
    liste.append(kort);
  }
  return liste;
}

export function visDemografi(rod, land, d) {
  rod.replaceChildren();
  if (!land) {
    rod.append(element('p', 'FN’s befolkningsdata findes ikke for dette område. Det gælder fx ubeboede områder og Antarktis.'));
    return;
  }
  const skalamaks = Math.ceil(pyramidemaks(land, d));
  let aar = d.noegleaar;

  const pyramidedel = element('section', null, 'demografi-pyramide');
  pyramidedel.setAttribute('aria-labelledby', 'pyramidetitel');
  const titel = element('h3', '', 'figurtitel'); titel.id = 'pyramidetitel';
  const valg = element('div', null, 'valg aarvalg');
  valg.setAttribute('role', 'group'); valg.setAttribute('aria-label', 'Vælg år for befolkningspyramiden');
  const figurplads = element('div', null, 'figurplads');
  const andele = element('p', '', 'aldersandele');
  andele.setAttribute('aria-live', 'polite');
  const tabel = element('details', null, 'datatabel');
  tabel.append(element('summary', 'Tal i tabel'));
  const tabelindhold = element('div'); tabel.append(tabelindhold);
  let transition;

  const tegn = () => {
    const fremskrevet = aar > d.noegleaar;
    titel.textContent = `Befolkningspyramide ${aar}${fremskrevet ? ' · fremskrivning' : ''}`;
    figurplads.replaceChildren(lavPyramide(land, aar, skalamaks, d.aldersgrupper, figurbredde(figurplads)));
    const a = aldersandele(land.pyramide[aar]);
    andele.textContent = `${befolkningstekst(a.alle)} indbyggere · 0–14 år: ${fmt(a.boern)} % · 15–64 år: ${fmt(a.voksne)} % · 65+ år: ${fmt(a.aeldre)} %` +
      (fremskrevet ? ' · FN’s mellemvariant, ikke målte tal' : '');
    for (const knap of valg.children) knap.setAttribute('aria-pressed', String(+knap.dataset.aar === aar));
    if (!transition) {
      transition = lavTransition(land, d.serieaar, d.noegleaar, aar, figurbredde(forloebsplads, 820));
      forloebsplads.append(transition);
    }
    transition.markerAar(aar);
    const t = element('table', null, 'pladetabel');
    t.append(element('caption', `${land.navn} ${aar}: antal personer pr. aldersgruppe (FN, WPP 2024${fremskrevet ? ', fremskrivning' : ''}).`));
    const hoved = element('tr');
    for (const tekst of ['Alder', 'Mænd', 'Kvinder']) { const th = element('th', tekst); th.scope = 'col'; hoved.append(th); }
    const thead = element('thead'); thead.append(hoved); t.append(thead);
    const krop = element('tbody');
    const p = land.pyramide[aar];
    for (let i = 20; i >= 0; i--) {
      const r = element('tr'), th = element('th', d.aldersgrupper[i]); th.scope = 'row';
      r.append(th, element('td', Math.round(p.maend[i] * 1000).toLocaleString('da-DK')), element('td', Math.round(p.kvinder[i] * 1000).toLocaleString('da-DK')));
      krop.append(r);
    }
    t.append(krop); tabelindhold.replaceChildren(t);
  };
  for (const a of d.pyramideaar) {
    const knap = element('button', a > d.noegleaar ? `${a}*` : `${a}`);
    knap.type = 'button'; knap.dataset.aar = a;
    if (a > d.noegleaar) knap.setAttribute('aria-label', `${a}, fremskrivning`);
    knap.onclick = () => { aar = a; tegn(); };
    valg.append(knap);
  }
  pyramidedel.append(titel, valg, figurplads, andele,
    element('p', `* Fremskrivning. Tal efter ${d.noegleaar} er FN’s mellemvariant – et scenarie, ikke målinger.`, 'figurnote'), tabel);

  const tal = element('section', null, 'demografi-tal');
  tal.setAttribute('aria-labelledby', 'noegletitel');
  const tt = element('h3', `Nøgletal ${d.noegleaar}`, 'figurtitel'); tt.id = 'noegletitel';
  tal.append(tt, noegletal(land, d));

  const forloeb = element('section', null, 'demografi-forloeb');
  forloeb.setAttribute('aria-labelledby', 'forloebstitel');
  const ft = element('h3', 'Fødsels- og dødsrate 1950–2100', 'figurtitel'); ft.id = 'forloebstitel';
  const forloebsplads = element('div');
  forloeb.append(ft, forloebsplads, element('p', 'Den skraverede afstand mellem kurverne er den naturlige tilvækst. Lodret streg: året i pyramiden. Stiplet: fremskrivning.', 'figurnote'));

  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const spoergsmaal = element('ol', null, 'opgaveliste');
  for (const s of [
    'Beskriv pyramidens form i dag. Er den bred forneden, lige eller smal forneden? Hvad fortæller det om fødsler og dødelighed?',
    'Hvilken fase i den demografiske transition er landet i? Brug fødsels- og dødsraten, og begrund med tallene.',
    'Skift mellem 1950, 2023 og 2050. Hvordan ændres andelen af børn (0–14 år) og ældre (65+)? Hvilke udfordringer giver det samfundet?',
    'Sammenlign børnedødelighed, fertilitet og HDI med et land fra en anden verdensdel. Hvordan hænger tallene sammen?'
  ]) spoergsmaal.append(element('li', s));
  undersoeg.append(spoergsmaal);

  rod.append(element('div', null, 'demografi-gitter'));
  rod.firstChild.append(pyramidedel, tal, forloeb);
  rod.append(undersoeg, lavInformation({
    navn: `demografi for ${land.navn}`, overskrift: 'Om data',
    introduktion: `FN’s befolkningsestimater og -fremskrivninger (WPP 2024). Nøgletal for ${d.noegleaar}.`,
    tekst: `Befolkning, aldersfordeling, fødsels- og dødsrate, fertilitet, spædbørns- og børnedødelighed, middellevetid, medianalder og migration: United Nations, Department of Economic and Social Affairs, Population Division (2024), World Population Prospects 2024, mellemvarianten, CC BY 3.0 IGO. Tal til og med ${d.noegleaar} er estimater; senere år er fremskrivninger, som bygger på antagelser om fertilitet, dødelighed og migration. Rater er pr. 1000 indbyggere (‰). Spædbørns- og børnedødelighed er pr. 1000 levendefødte. HDI, BNI pr. indbygger (købekraftskorrigeret i 2021-dollar) og gennemsnitlig skolegang: UNDP, Human Development Report 2025 (data for 2023). Byandel: Verdensbanken, World Development Indicators (SP.URB.TOTL.IN.ZS, ${d.noegleaar}). Landenes definition af »by« er forskellig. Grænser og navne følger FN’s statistik og er ikke en stillingtagen til omstridte områder.`
  }));
  tegn();
}

// To lande side om side: samme år, samme skala på pyramider og rater, og
// nøgletallene i én tabel. lande: [{ navn, data }], hvor data kan mangle.
export function visDemografiSammenligning(rod, lande, d) {
  rod.replaceChildren();
  const medData = lande.filter(l => l.data);
  if (!medData.length) {
    rod.append(element('p', 'FN’s befolkningsdata findes ikke for nogen af de to områder.'));
    return;
  }
  const skalamaks = Math.ceil(Math.max(...medData.map(l => pyramidemaks(l.data, d))));
  const ratemaks = Math.max(...medData.map(l => transitionsmaks(l.data)));
  let aar = d.noegleaar;

  const valg = element('div', null, 'valg aarvalg');
  valg.setAttribute('role', 'group'); valg.setAttribute('aria-label', 'Vælg år for begge befolkningspyramider');
  const aarstitel = element('h3', '', 'figurtitel'); aarstitel.id = 'sammenligningstitel';
  const pyramider = element('div', null, 'sammenligning-par');
  const andele = [];
  const pladser = lande.map((l, i) => {
    const kolonne = element('section', null, 'sammenligning-kolonne');
    const overskrift = element('h4', l.navn, 'landenavn'); overskrift.id = `sammenlignland${i}`;
    kolonne.setAttribute('aria-labelledby', overskrift.id);
    const plads = element('div', null, 'figurplads');
    const tekst = element('p', '', 'aldersandele');
    kolonne.append(overskrift);
    if (!l.data) kolonne.append(element('p', 'FN’s befolkningsdata findes ikke for dette område.'));
    else kolonne.append(plads, tekst);
    pyramider.append(kolonne);
    andele.push(tekst);
    return plads;
  });
  const status = element('p', '', 'skjult'); status.setAttribute('aria-live', 'polite');

  const forloeb = element('div', null, 'sammenligning-par');
  const transitioner = lande.map(l => {
    const kolonne = element('div', null, 'sammenligning-kolonne');
    kolonne.append(element('h4', l.navn, 'landenavn'));
    forloeb.append(kolonne);
    if (!l.data) { kolonne.append(element('p', 'Ingen data.')); return null; }
    return kolonne;
  });

  const tegn = () => {
    const fremskrevet = aar > d.noegleaar;
    aarstitel.textContent = `Befolkningspyramider ${aar}${fremskrevet ? ' · fremskrivning' : ''}`;
    lande.forEach((l, i) => {
      if (!l.data) return;
      pladser[i].replaceChildren(lavPyramide(l.data, aar, skalamaks, d.aldersgrupper, figurbredde(pladser[i])));
      const a = aldersandele(l.data.pyramide[aar]);
      andele[i].textContent = `${befolkningstekst(a.alle)} indb. · 0–14 år: ${fmt(a.boern)} % · 15–64 år: ${fmt(a.voksne)} % · 65+: ${fmt(a.aeldre)} %`;
      if (!transitioner[i].figur) {
        transitioner[i].figur = lavTransition(l.data, d.serieaar, d.noegleaar, aar, figurbredde(transitioner[i]), ratemaks);
        transitioner[i].append(transitioner[i].figur);
      }
      transitioner[i].figur.markerAar(aar);
    });
    status.textContent = `${aar}${fremskrevet ? ', fremskrivning' : ''}: ` + lande.map((l, i) => l.data ? `${l.navn} ${andele[i].textContent}` : '').filter(Boolean).join('. ');
    for (const knap of valg.children) knap.setAttribute('aria-pressed', String(+knap.dataset.aar === aar));
  };
  for (const a of d.pyramideaar) {
    const knap = element('button', a > d.noegleaar ? `${a}*` : `${a}`);
    knap.type = 'button'; knap.dataset.aar = a;
    if (a > d.noegleaar) knap.setAttribute('aria-label', `${a}, fremskrivning`);
    knap.onclick = () => { aar = a; tegn(); };
    valg.append(knap);
  }

  const pyramidedel = element('section', null, 'sammenligning-pyramider');
  pyramidedel.setAttribute('aria-labelledby', aarstitel.id);
  pyramidedel.append(aarstitel, valg, pyramider, status,
    element('p', `Samme skala i begge pyramider (procent af hvert lands befolkning). * Fremskrivning efter ${d.noegleaar}: FN’s mellemvariant, ikke målinger.`, 'figurnote'));

  // Nøgletal: én række pr. tal. Forklaringen står ved navnet, når den er ens for begge lande.
  const tabel = element('table', null, 'sammenligningstabel');
  tabel.append(element('caption', `Nøgletal ${d.noegleaar}`));
  const hoved = element('tr');
  const tom = element('th', 'Nøgletal'); tom.scope = 'col'; hoved.append(tom);
  for (const l of lande) { const th = element('th', l.navn); th.scope = 'col'; hoved.append(th); }
  const thead = element('thead'); thead.append(hoved); tabel.append(thead);
  const raekker = lande.map(l => l.data ? noegletalraekker(l.data, d) : null);
  const skabelon = raekker.find(Boolean);
  const krop = element('tbody');
  skabelon.forEach(([navn], r) => {
    const tr = element('tr');
    const forklaringer = raekker.map(rk => rk?.[r][2]);
    const ens = forklaringer.every(f => f === forklaringer[0]);
    const th = element('th'); th.scope = 'row';
    th.append(element('span', navn, 'noeglenavn'));
    if (ens) th.append(element('span', forklaringer[0], 'forklaring'));
    tr.append(th);
    raekker.forEach(rk => {
      const td = element('td');
      td.append(element('span', rk ? rk[r][1] : '–', 'vaerdi'));
      if (rk && !ens) td.append(element('span', rk[r][2], 'forklaring'));
      tr.append(td);
    });
    krop.append(tr);
  });
  tabel.append(krop);
  const taldel = element('section', null, 'sammenligning-tal');
  const tt = element('h3', `Nøgletal ${d.noegleaar}`, 'figurtitel'); tt.id = 'sammenligningnoegletal';
  taldel.setAttribute('aria-labelledby', tt.id);
  const rulle = element('div', null, 'tabelrulle'); rulle.append(tabel);
  taldel.append(tt, rulle);

  const forloebsdel = element('section', null, 'sammenligning-forloeb');
  const ft = element('h3', 'Fødsels- og dødsrate 1950–2100', 'figurtitel'); ft.id = 'sammenligningforloeb';
  forloebsdel.setAttribute('aria-labelledby', ft.id);
  forloebsdel.append(ft, forloeb, element('p', 'Samme lodrette skala for begge lande. Skraveret: naturlig tilvækst. Lodret streg: året i pyramiderne. Stiplet: fremskrivning.', 'figurnote'));

  const undersoeg = element('details', null, 'undersoeg');
  undersoeg.append(element('summary', 'Undersøg'));
  const spoergsmaal = element('ol', null, 'opgaveliste');
  for (const s of [
    'Sammenlign de to pyramiders form i dag. Hvilket land har flest børn og hvilket flest ældre i forhold til befolkningen?',
    'Placér begge lande i den demografiske transition. Begrund med fødsels- og dødsraten.',
    'Find tre nøgletal, hvor landene er meget forskellige. Hvordan kan forskellene forklares med økonomi, sundhed og uddannelse?',
    'Skift til 1950 og 2050. Er landene ved at blive mere ens eller mere forskellige?'
  ]) spoergsmaal.append(element('li', s));
  undersoeg.append(spoergsmaal);

  rod.append(pyramidedel, taldel, forloebsdel, undersoeg, lavInformation({
    navn: `demografi for ${lande.map(l => l.navn).join(' og ')}`, overskrift: 'Om data',
    introduktion: `FN’s befolkningsestimater og -fremskrivninger (WPP 2024). Nøgletal for ${d.noegleaar}.`,
    tekst: `Samme kilder som for ét land: FN, World Population Prospects 2024 (mellemvarianten, CC BY 3.0 IGO); UNDP, Human Development Report 2025; Verdensbanken (byandel). Pyramiderne viser procent af hvert lands egen befolkning, så formen kan sammenlignes, selvom landene er meget forskellige i størrelse. Begge pyramider og begge ratefigurer har samme skala. Tal efter ${d.noegleaar} er fremskrivninger.`
  }));
  tegn();
}
