import { steder, modeller, oevelser } from './modeller.js';
import { lavInformation, lukInformation } from './information.js';
import { verdensdele } from './quizmodel.js';
import { hentIndeks, landFraKort, visLandemenu, lukLandemenu } from './landemenu.js';
import { lavLag } from './lagknap.js';
import { startLagmenu } from './lagmenu.js';

const dialog = document.querySelector('#udforsker');
const indhold = document.querySelector('#dialogindhold');
const titel = document.querySelector('#dialogtitel');
let globus;
let lagmenu;
let senesteFokus;
let danmarkskort;
let landAktivt = false;
let henterLand = false;
let quiz;
let henterQuiz = false;

async function visDanmark() {
  if (!globus || henterLand || henterQuiz || quiz) return;
  henterLand = true;
  const status = document.querySelector('#kortstatus');
  status.classList.add('landestatus');
  canvas.setAttribute('aria-busy', 'true');
  status.textContent = 'Henter Danmarkskort …'; status.hidden = false;
  try {
    if (!danmarkskort) {
      const { hentDanmark } = await import('./landekort.js');
      danmarkskort = await hentDanmark();
    }
    danmarkskort.nulstil();
    skiftLand(true);
    if (dialog.open) {
      senesteFokus = document.querySelector('#til-globus');
      dialog.close();
    }
    document.querySelector('#til-globus').focus({ preventScroll: true });
    status.hidden = true;
  } catch {
    status.textContent = 'Danmarkskortet kunne ikke hentes. Globussen og simulationerne virker stadig. Prøv igen, eller genindlæs siden, hvis fejlen fortsætter.';
    // Samme fejl er synlig, hvis valget kom fra den åbne stedliste.
    const besked = document.querySelector('#landefejl');
    if (besked) { besked.textContent = status.textContent; besked.hidden = false; }
  } finally {
    henterLand = false;
    canvas.removeAttribute('aria-busy');
  }
}

const BETJENING = 'Drej med træk eller piletaster · Zoom med to fingre eller +/−. Tryk på et land for demografi og klima.';

// Tryk på et land på globussen: lille menu ved trykket. Danmark har også landekort.
async function vaelgLand(feature, punkt) {
  if (!globus || henterLand || henterQuiz || quiz) return;
  let navne;
  try { navne = await hentIndeks(); } catch { /* Kortets engelske navn bruges så. */ }
  const land = landFraKort(feature, navne);
  globus.markerLand(feature);
  const valg = [
    { id: 'demografi', titel: 'Demografi', tekst: 'Befolkningspyramide og nøgletal' },
    { id: 'klima', titel: 'Klima', tekst: 'Hydrotermfigurer fra vejrstationer' }
  ];
  if (land.id === '208') valg.push({ id: 'landekort', titel: 'Landekort', tekst: 'Jylland, øerne og Bornholm' });
  visLandemenu({
    land, punkt, valg,
    vaelg: id => {
      if (id === 'landekort') { globus.markerLand(null); visDanmark(); }
      else visLandedata(land, id, canvas);
    },
    lukket: () => { globus.markerLand(null); canvas.focus({ preventScroll: true }); }
  });
}

let landevisning = 0;
// Ét land eller to side om side. Sammenlign åbner et søgefelt under fanerne;
// det valgte land vises ved siden af i begge faner, indtil det fjernes igen.
function visLandedata(land, fane, fokusEfter) {
  aabn(land.navn);
  dialog.classList.add('bred');
  if (fokusEfter) senesteFokus = fokusEfter;
  let andet = null;
  let aktiv = fane;
  const noter = element('div', '', 'landenoter');
  const faner = element('div', '', 'valg landefaner');
  faner.setAttribute('role', 'group');
  faner.setAttribute('aria-label', `Vælg emne for ${land.navn}`);
  const rum = element('div', '', 'landedata');
  rum.id = 'landedata';
  const vis = async id => {
    aktiv = id;
    const nr = ++landevisning;
    for (const knap of faner.querySelectorAll('[data-fane]')) knap.setAttribute('aria-pressed', String(knap.dataset.fane === id));
    rum.replaceChildren(element('p', id === 'demografi' ? 'Henter befolkningsdata …' : 'Henter klimadata …', 'antal'));
    rum.setAttribute('aria-busy', 'true');
    const par = andet ? [land, andet] : null;
    try {
      if (id === 'demografi') {
        const modul = await import('./demografi.js');
        const data = await modul.hentDemografi();
        if (nr !== landevisning) return;
        if (par) modul.visDemografiSammenligning(rum, par.map(l => ({ navn: l.navn, data: data.lande[l.id] })), data);
        else modul.visDemografi(rum, data.lande[land.id], data);
      } else {
        const modul = await import('./klima.js');
        const [data, andele] = await Promise.all([modul.hentKlima(), modul.hentKlimaandele().catch(() => null)]);
        if (nr !== landevisning) return;
        const zoner = id => andele && { vahl: andele.vahl[id], koppen: andele.koppen[id] };
        if (par) modul.visKlimaSammenligning(rum, par.map(l => ({ navn: l.navn, stationer: data.lande[l.id], andele: zoner(l.id) })));
        else modul.visKlima(rum, data.lande[land.id], land.navn, zoner(land.id));
      }
    } catch {
      if (nr === landevisning) rum.replaceChildren(element('p', 'Data kunne ikke hentes. Vælg fanen igen, eller genindlæs siden. Globussen og simulationerne virker stadig.'));
    } finally {
      if (nr === landevisning) rum.removeAttribute('aria-busy');
    }
  };
  for (const [id, tekst] of [['demografi', 'Demografi'], ['klima', 'Klima']]) {
    const knap = element('button', tekst);
    knap.type = 'button'; knap.dataset.fane = id;
    knap.onclick = () => vis(id);
    faner.append(knap);
  }
  const sammenlign = element('button', 'Sammenlign ⇄', 'sammenlignknap');
  sammenlign.type = 'button';
  sammenlign.setAttribute('aria-expanded', 'false');
  sammenlign.setAttribute('aria-controls', 'sammenlignvalg');
  const stop = element('button', '', 'stopsammenligning');
  stop.type = 'button'; stop.hidden = true;
  faner.append(sammenlign, stop);
  if (land.id === '208') {
    const kort = element('button', 'Landekort →');
    kort.type = 'button'; kort.disabled = !globus;
    kort.onclick = visDanmark;
    faner.append(kort);
  }

  const valgpanel = element('div', '', 'sammenlignvalg');
  valgpanel.id = 'sammenlignvalg'; valgpanel.hidden = true;
  const label = element('label', `Sammenlign ${land.navn} med`, 'soegefelt');
  const felt = element('input');
  felt.type = 'search'; felt.placeholder = 'Skriv et land, fx Japan';
  felt.autocomplete = 'off';
  label.append(felt);
  const forslag = element('div', '', 'landeknapper');
  forslag.setAttribute('aria-live', 'polite');
  valgpanel.append(label, forslag);
  let navne = {};
  const visForslag = () => {
    const lande = felt.value.trim()
      ? findLande(navne, felt.value).filter(([id]) => id !== land.id)
      : [['208', navne['208'] || 'Danmark']].filter(([id]) => id !== land.id);
    forslag.replaceChildren(...lande.map(([id, navn]) => {
      const knap = element('button', navn);
      knap.type = 'button';
      knap.onclick = () => vaelgAndet(landFraKort({ id, properties: { name: navn } }, navne));
      return knap;
    }));
    if (felt.value.trim() && !lande.length) forslag.append(element('p', 'Intet land passer. Prøv det danske navn.', 'antal'));
  };
  hentIndeks().then(n => { navne = n; if (felt.isConnected) visForslag(); }).catch(() => {});
  felt.addEventListener('input', visForslag);
  const lukValg = () => {
    valgpanel.hidden = true;
    sammenlign.setAttribute('aria-expanded', 'false');
    sammenlign.focus({ preventScroll: true });
  };
  // Escape i søgefeltet lukker kun feltet, ikke hele dialogen.
  valgpanel.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault(); event.stopPropagation();
    lukValg();
  });
  sammenlign.onclick = () => {
    if (!valgpanel.hidden) return lukValg();
    valgpanel.hidden = false;
    sammenlign.setAttribute('aria-expanded', 'true');
    felt.value = '';
    visForslag();
    felt.focus();
  };
  const opdaterTop = () => {
    titel.textContent = andet ? `${land.navn} og ${andet.navn}` : land.navn;
    sammenlign.textContent = andet ? 'Andet land ⇄' : 'Sammenlign ⇄';
    sammenlign.setAttribute('aria-label', andet ? `Sammenlign ${land.navn} med et andet land end ${andet.navn}` : `Sammenlign ${land.navn} med et andet land`);
    stop.hidden = !andet;
    if (andet) {
      stop.textContent = `× ${andet.navn}`;
      stop.setAttribute('aria-label', `Fjern ${andet.navn}, vis kun ${land.navn}`);
    }
    noter.replaceChildren(...[land, andet].filter(l => l?.note).map(l => element('p', `${l.navn}: ${l.note}`, 'metadata')));
  };
  const vaelgAndet = nyt => {
    andet = nyt;
    valgpanel.hidden = true;
    sammenlign.setAttribute('aria-expanded', 'false');
    opdaterTop();
    faner.querySelector(`[data-fane="${aktiv}"]`).focus({ preventScroll: true });
    vis(aktiv);
  };
  stop.onclick = () => {
    andet = null;
    opdaterTop();
    sammenlign.focus({ preventScroll: true });
    vis(aktiv);
  };
  opdaterTop();
  indhold.append(noter, faner, valgpanel, rum);
  vis(fane);
}

function skiftLand(aktiv) {
  landAktivt = aktiv;
  document.querySelector('.atlas').classList.toggle('landekort', aktiv);
  document.querySelector('#landetop').hidden = !aktiv;
  document.querySelector('#lag-aabn').hidden = aktiv;
  lagmenu?.skjul();
  if (valgpanel.matches(':popover-open')) valgpanel.hidePopover();
  globus.visLand(aktiv ? danmarkskort : null);
  document.querySelector('.rotation').setAttribute('aria-label', aktiv ? 'Flyt landekortet' : 'Drej globussen');
  for (const knap of document.querySelectorAll('[data-drej]')) {
    const retning = { vest: 'vest', oest: 'øst', nord: 'nord', syd: 'syd' }[knap.dataset.drej];
    knap.setAttribute('aria-label', `${aktiv ? 'Flyt kortet' : 'Drej'} mod ${retning}`);
  }
  document.querySelector('#betjening').textContent = aktiv
    ? 'Danmark: Jylland og øerne inkl. Bornholm · Træk eller brug piletaster · Zoom med to fingre eller +/−.'
    : BETJENING;
  document.querySelector('#visningsstatus').textContent = aktiv ? 'Danmarkskort åbnet. Tilbage til globussen med knappen Globus eller Escape.' : 'Tilbage på globussen.';
  opdaterPladebeskrivelse();
}

function tilbageTilGlobus(fokus = true) {
  if (!landAktivt) return;
  skiftLand(false);
  if (fokus) canvas.focus({ preventScroll: true });
}
document.querySelector('#til-globus').onclick = () => tilbageTilGlobus();
document.querySelector('#landekilde').onclick = () => {
  aabn('Om Danmarkskortet');
  indhold.append(element('p', 'Kortet viser Jylland og de danske øer, inklusive Bornholm. Grønland og Færøerne indgår ikke i denne første landevisning. Nord er opad. Byerne er orienteringspunkter.'));
  indhold.append(element('p', 'Kyster og landegrænser: Natural Earth via world-atlas 2.0.2. Danmark vises i 1:10 mio.; omgivelserne er nedtonet i 1:50 mio. Kortet er generaliseret: småøer og kystdetaljer kan mangle. Det er et oversigtskort uden terræn, veje eller aktuelle måledata. Projektionen er Mercator. Målestokken viser en lokal, omtrentlig afstand.'));
  const kilde = element('a', 'Natural Earth: data og vilkår →');
  kilde.href = 'https://www.naturalearthdata.com/about/terms-of-use/';
  indhold.append(kilde);
};

let quizdel = verdensdele[0];
document.querySelector('#quiz').onclick = () => {
  aabn('Find landet');
  indhold.append(element('p', 'Vælg en verdensdel. Du får ét landenavn ad gangen og udpeger landet på globussen, indtil du har været igennem dem alle i tilfældig rækkefølge.'));
  const valg = element('fieldset', '', 'verdensvalg');
  valg.append(element('legend', 'Verdensdel'));
  const detaljer = element('details', '', 'pladeoversigt');
  detaljer.append(element('summary', 'Lande, afgrænsning og kortkilde'));
  const afgraensning = element('p', '');
  const start = element('button', ''); start.id = 'quiz-start'; start.disabled = !globus;
  const vis = () => {
    afgraensning.textContent = quizdel.afgraensning;
    start.textContent = `Start ${quizdel.quiznavn}`;
  };
  for (const del of verdensdele) {
    const felt = element('label');
    const radio = element('input'); radio.type = 'radio'; radio.name = 'verdensdel'; radio.value = del.id;
    radio.checked = del === quizdel;
    radio.onchange = () => { quizdel = del; vis(); };
    felt.append(radio, element('span', del.navn), element('small', `${del.lande.length} lande`));
    valg.append(felt);
  }
  vis();
  detaljer.append(afgraensning);
  detaljer.append(element('p', 'Selvstyrende områder (fx Grønland og Færøerne) og afhængige territorier er ikke egne spørgsmål. Natural Earth 1:10 mio. via world-atlas 2.0.2, public domain / ISC. Kyster og grænser er generaliserede og er ikke en stillingtagen til omstridte områder. Ringene viser placering, ikke landenes areal. Er et lille lands polygon kollapset i kildens koordinatkvantisering (fx Vatikanet), repræsenteres landet af sin ring.'));
  const kilde = element('a', 'FN’s geografiske inddeling →'); kilde.href = 'https://unstats.un.org/unsd/methodology/m49/'; detaljer.append(kilde);
  const status = element('p', !globus ? 'Quizzen kræver, at globussen kan vises. Alle simulationer er stadig tilgængelige.' : '');
  status.id = 'quiz-status'; status.setAttribute('role', 'status');
  start.onclick = async () => {
    if (henterQuiz || henterLand || quiz) return;
    const del = quizdel;
    henterQuiz = true; start.disabled = true; start.setAttribute('aria-busy', 'true'); status.textContent = `Henter kort: ${del.navn} …`;
    try {
      const { startLandequiz } = await import('./landequiz.js');
      quiz = await startLandequiz(globus, del, () => {
        if (!dialog.open || document.querySelector('#quiz-start') !== start) throw new Error('Quizstart afbrudt');
        tilbageTilGlobus(false);
        if (valgpanel.matches(':popover-open')) valgpanel.hidePopover();
        senesteFokus = canvas; dialog.close();
        document.querySelector('#kortstatus').hidden = true;
      }, () => {
        quiz = null; opdaterPladebeskrivelse();
        document.querySelector('#betjening').textContent = BETJENING;
        document.querySelector('#quiz').focus({ preventScroll: true });
      });
    } catch {
      status.textContent = `${del.kort} kunne ikke hentes. Prøv igen, eller genindlæs siden. Globussen og simulationerne kan stadig bruges.`;
    } finally { henterQuiz = false; start.disabled = false; start.removeAttribute('aria-busy'); }
  };
  const vejledning = element('details', '', 'pladeoversigt');
  vejledning.append(element('summary', 'Sådan spiller du'));
  vejledning.append(element('p', 'Forkert land? Prøv igen. Vis landet hjælper dig videre og tæller som hjælp. Små lande er markeret med ringe; zoom ind for at skelne dem. Du kan dreje og zoome hele tiden.'));
  vejledning.append(element('p', 'Tastatur: brug piletaster til at dreje og +/− til zoom med fokus på globussen. Shift+pil finjusterer. Enter vælger landet under sigtekornet midt på globussen.'));
  indhold.append(valg, start, status, vejledning, detaljer);
};

function element(type, tekst, klasse) {
  const el = document.createElement(type);
  if (tekst) el.textContent = tekst;
  if (klasse) el.className = klasse;
  return el;
}

function aabn(overskrift) {
  lukInformation();
  lukLandemenu();
  dialog.classList.remove('bred');
  titel.textContent = overskrift;
  indhold.replaceChildren();
  if (!dialog.open) {
    senesteFokus = document.activeElement;
    dialog.showModal();
  }
  dialog.scrollTop = 0;
  titel.tabIndex = -1;
  titel.focus();
}

function visModeller(liste) {
  const kortliste = element('div', '', 'kortliste');
  for (const model of liste) {
    const kort = element('article', '', 'modelkort');
    kort.append(element('p', `${model.emne} · ${model.niveau}`, 'metadata'));
    kort.append(element('h3', model.titel), element('p', model.beskrivelse));
    if (!model.steder.length) kort.append(element('p', model.modelnote || 'Global, idealiseret model · gælder hele Jorden', 'metadata'));
    const link = element('a', 'Åbn simulation →');
    link.href = model.sti;
    link.setAttribute('aria-label', `Åbn simulation: ${model.titel}`);
    kort.append(link);
    kortliste.append(kort);
  }
  return kortliste;
}

// Forsøgsvejledninger som sammenfoldet liste, så modellerne står først.
function visOevelser(liste, titel = 'Forsøgsvejledninger') {
  const boks = element('details', '', 'oevelser');
  boks.append(element('summary', `${titel} (${liste.length})`));
  const ul = element('ul', '', 'oevelsesliste');
  for (const oevelse of liste) {
    const sti = `/Øvelser/Geografi/${oevelse.id}/${oevelse.id}`;
    const li = element('li');
    const link = element('a', oevelse.titel);
    link.href = `${sti}.html`;
    const pdf = element('a', 'PDF', 'pdf');
    pdf.href = `${sti}.pdf`;
    pdf.setAttribute('aria-label', `${oevelse.titel} som PDF`);
    li.append(link, ' ', pdf, element('span', [oevelse.emne, oevelse.niveau].filter(Boolean).join(' · '), 'metadata'), element('span', oevelse.beskrivelse));
    ul.append(li);
  }
  boks.append(ul);
  return boks;
}

const oevelserTil = (felt, id) => oevelser.filter(oevelse => oevelse[felt].includes(id));

function visSted(sted) {
  aabn(sted.navn);
  const tilbage = element('button', '← Alle steder', 'tilbage');
  tilbage.onclick = visSteder;
  indhold.append(tilbage, lavInformation({
    navn: sted.navn, introduktion: sted.forklaring,
    note: sted.modelnote, tekst: sted.forbehold
  }));
  if (globus) {
    const find = element('button', 'Vis på globussen', 'tilbage');
    find.onclick = () => {
      tilbageTilGlobus(false);
      senesteFokus = document.querySelector('#globus');
      dialog.close();
      globus.visSted(sted);
      document.querySelector('#globus').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  if (sted.fordybelse) indhold.append(visFordybelse(sted.fordybelse));
  indhold.append(visModeller(modeller.filter(model => model.steder.includes(sted.id))));
  const egne = oevelserTil('steder', sted.id);
  if (egne.length) indhold.append(visOevelser(egne));
}

function visFordybelse({ titel, beskrivelse, sti, kort: kortsti }) {
  const kort = element('article', '', 'modelkort fordybelse');
  kort.append(element('p', kortsti ? 'Island i 3D · landskab og magmakamre' : 'Skematisk tværsnit · hører til dette sted', 'metadata'));
  kort.append(element('h3', titel), element('p', beskrivelse));
  const links = element('div', '', 'fordybelseslinks');
  if (kortsti) {
    const tilKort = element('a', 'Se kortet →');
    tilKort.href = kortsti;
    tilKort.setAttribute('aria-label', `Se kortet: ${titel}`);
    links.append(tilKort);
  }
  const link = element('a', 'Se under overfladen →');
  link.href = sti;
  link.setAttribute('aria-label', `Se under overfladen: ${titel}`);
  links.append(link);
  kort.append(links);
  return kort;
}

function visSteder() {
  aabn('Steder');
  const land = element('button', 'Danmark — åbn landekort', 'tilbage');
  land.onclick = visDanmark;
  land.disabled = !globus;
  const fejl = element('p'); fejl.id = 'landefejl'; fejl.hidden = true; fejl.setAttribute('role', 'status');
  indhold.append(land, fejl);
  indhold.append(element('p', 'Vælg et geografisk eksempel. Simulationerne er generelle modeller, som hjælper dig med at undersøge processerne.'));
  const liste = element('div', '', 'kortliste');
  for (const sted of steder) {
    const knap = element('button', '', 'stedkort');
    knap.append(element('strong', sted.navn), element('span', sted.forklaring));
    knap.onclick = () => visSted(sted);
    liste.append(knap);
  }
  indhold.append(liste, visOevelser(oevelserTil('steder', 'danmark'), 'Øvelser i Danmark'));
}

function visProcesser() {
  aabn('Processer');
  indhold.append(element('p', 'Vælg en proces. Global atmosfære handler om hele Jorden og har derfor ingen stedmarkør.'));
  const pladeopgave = element('button', 'Undersøg pladegrænserne', 'tilbage');
  pladeopgave.onclick = visPladeopgave;
  const klimaopgave = element('button', 'Undersøg klimazonerne', 'tilbage');
  klimaopgave.onclick = visKlimaopgave;
  const seismikopgave = element('button', 'Undersøg jordskælv og vulkaner', 'tilbage');
  seismikopgave.onclick = visSeismikopgave;
  const havbundsopgave = element('button', 'Undersøg havbundens alder', 'tilbage');
  havbundsopgave.onclick = visHavbundsopgave;
  const nedboersopgave = element('button', 'Undersøg nedbøren måned for måned', 'tilbage');
  nedboersopgave.onclick = visNedboersopgave;
  const temaopgave = element('button', 'Undersøg landene på temakort', 'tilbage');
  temaopgave.onclick = visTemaopgave;
  indhold.append(pladeopgave, ' ', havbundsopgave, ' ', klimaopgave, ' ', nedboersopgave, ' ', seismikopgave, ' ', temaopgave);
  const valg = element('div', '', 'valg');
  valg.setAttribute('role', 'group');
  valg.setAttribute('aria-label', 'Filtrér efter proces');
  const resultater = element('div');
  const antal = element('p', '', 'antal');
  antal.setAttribute('role', 'status');
  for (const emne of ['Alle', ...new Set(modeller.map(model => model.emne))]) {
    const knap = element('button', emne);
    knap.setAttribute('aria-pressed', String(emne === 'Alle'));
    knap.onclick = () => {
      for (const anden of valg.children) anden.setAttribute('aria-pressed', String(anden === knap));
      const fund = modeller.filter(model => emne === 'Alle' || model.emne === emne);
      antal.textContent = `${fund.length} simulationer`;
      resultater.replaceChildren(visModeller(fund));
    };
    valg.append(knap);
  }
  antal.textContent = `${modeller.length} simulationer`;
  resultater.append(visModeller(modeller));
  indhold.append(valg, antal, resultater, visOevelser(oevelser));
}

// Tillad både grønland/groenland og føhn/foehn i søgningen.
function normaliser(tekst) {
  return tekst.toLowerCase().replaceAll('æ', 'ae').replaceAll('ø', 'oe').replaceAll('å', 'aa').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Landenavne (fra navneindekset), der passer på søgeteksten: højst otte, alfabetisk.
function findLande(navne, tekst) {
  const ord = normaliser(tekst).trim().split(/\s+/).filter(Boolean);
  if (!ord.length) return [];
  return Object.entries(navne).filter(([, navn]) => {
    const n = normaliser(navn);
    return ord.every(del => n.split(/[\s-]+/).some(d => d.startsWith(del)) || n.startsWith(ord.join(' ')));
  }).sort((a, b) => a[1].localeCompare(b[1], 'da')).slice(0, 8);
}

function visSoeg() {
  aabn('Søg i atlasset');
  const label = element('label', 'Land, sted, proces, simulation eller øvelse', 'soegefelt');
  const felt = element('input');
  felt.type = 'search';
  felt.placeholder = 'Fx Kenya, Island, regn eller drivhuseffekt';
  label.append(felt);
  const antal = element('p', '', 'antal');
  antal.setAttribute('role', 'status');
  const resultat = element('div');
  const landeresultat = element('div', '', 'landeresultat');
  let navne = {};
  hentIndeks().then(n => { navne = n; if (felt.isConnected) soeg(); }).catch(() => {});
  function soeg() {
    const ord = normaliser(felt.value).trim().split(/\s+/).filter(Boolean);
    const lande = findLande(navne, felt.value);
    landeresultat.replaceChildren();
    if (lande.length) {
      landeresultat.append(element('h3', 'Lande · demografi og klima', 'underoverskrift'));
      const liste = element('div', '', 'landeknapper');
      for (const [id, navn] of lande) {
        const knap = element('button', navn);
        knap.type = 'button';
        knap.onclick = () => {
          const centrum = globus?.landecentrum(id);
          if (centrum) globus.visPunkt(centrum);
          globus?.markerLand(id);
          visLandedata(landFraKort({ id, properties: { name: navn } }, navne), 'demografi');
        };
        liste.append(knap);
      }
      landeresultat.append(liste);
    }
    const fund = modeller.filter(model => {
      const stedtekst = steder.filter(sted => model.steder.includes(sted.id)).map(sted => `${sted.navn} ${sted.forklaring}`).join(' ');
      const tekst = normaliser(`${model.titel} ${model.emne} ${model.niveau} ${model.beskrivelse} ${model.soegeord || ''} ${stedtekst}`);
      return ord.every(del => tekst.includes(del));
    });
    const oevelsesfund = oevelser.filter(oevelse => {
      const tekst = normaliser(`${oevelse.titel} ${oevelse.emne} ${oevelse.beskrivelse}`);
      return ord.every(del => tekst.includes(del));
    });
    antal.textContent = `${fund.length} af ${modeller.length} simulationer${oevelsesfund.length ? ` · ${oevelsesfund.length} ${oevelsesfund.length === 1 ? 'øvelse' : 'øvelser'}` : ''}${lande.length ? ` · ${lande.length} ${lande.length === 1 ? 'land' : 'lande'}` : ''}`;
    if (!fund.length && !lande.length && !oevelsesfund.length) {
      resultat.replaceChildren(element('p', 'Ingen resultater. Prøv et land, et sted eller en proces, fx Kenya, klima eller vulkan.'));
    } else {
      resultat.replaceChildren(visModeller(fund));
      if (oevelsesfund.length) {
        const boks = visOevelser(oevelsesfund);
        boks.open = ord.length > 0;
        resultat.append(boks);
      }
    }
  }
  felt.addEventListener('input', soeg);
  indhold.append(label, antal, landeresultat, resultat);
  soeg();
  felt.focus();
}

for (const knap of document.querySelectorAll('[data-indgang]')) {
  knap.onclick = { steder: visSteder, processer: visProcesser, soeg: visSoeg }[knap.dataset.indgang];
}
document.querySelector('#luk').onclick = () => dialog.close();
dialog.addEventListener('close', () => {
  lukInformation();
  if (dialog.classList.contains('bred')) globus?.markerLand(null);
  const retur = senesteFokus?.getClientRects().length ? senesteFokus : document.querySelector('#lag-aabn');
  retur?.focus({ preventScroll: true });
});
document.querySelector('#fokus').onclick = event => {
  const aktiv = document.body.classList.toggle('fokus');
  event.currentTarget.setAttribute('aria-pressed', String(aktiv));
  event.currentTarget.textContent = aktiv ? 'Afslut fokus' : 'Fokus';
};
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  // Landemenuen er en popover og lukker selv ved Escape.
  if (document.querySelector('#landemenu:popover-open, #lagmenu:popover-open')) return;
  const panel = document.querySelector('#pladevalg:popover-open');
  if (panel) {
    event.preventDefault();
    panel.hidePopover();
    document.querySelector('#pladevisning').focus({ preventScroll: true });
  } else if (!dialog.open && quiz) {
    event.preventDefault(); quiz.stop();
  } else if (!dialog.open && landAktivt) {
    event.preventDefault(); tilbageTilGlobus();
  } else if (!dialog.open && document.body.classList.contains('fokus')) document.querySelector('#fokus').click();
});
document.querySelector('#hjaelp').onclick = () => {
  aabn('Sådan bruger du atlasset');
  indhold.append(element('p', 'Quiz → vælg verdensdel: find landet på globussen. Rigtigt svar giver næste land efter et øjeblik; Vis landet viser placeringen og tæller som hjælp. Ved hjælp vælger du selv Næste land. Små lande har ringe. Med tastatur bruges piletaster, Shift+pil til finjustering og Enter i sigtekornet. Knappen med verdensdelens navn (eller Home) viser hele området igen uden at starte quizzen forfra. Afslut quiz eller Escape vender tilbage til atlasset.'));
  indhold.append(element('p', 'Træk i globussen med mus eller én finger for at dreje. Zoom med to fingre, knapperne +/− eller musehjulet, når globussen har fokus.'));
  indhold.append(element('p', 'Tryk på et land på globussen for at åbne landemenuen. Demografi viser befolkningspyramide, fødsels- og dødsrate og nøgletal som børnedødelighed og HDI fra FN. Klima viser hydrotermfigurer for udvalgte vejrstationer. Med Sammenlign ⇄ vælger du et land mere, som vises ved siden af med samme skala. Zoom ind, hvis landet er for lille at ramme. Med tastatur – og for meget små lande – skriver du landets navn i Søg.'));
  indhold.append(element('p', 'Åbn Lag og vælg Geologi, Klima eller Demografi og levevilkår. Lag kan kombineres; klimazoner og landenes nøgletal farver begge landene og vises derfor ét ad gangen. Under hvert aktivt lag står signatur, indstillinger og kilder.'));
  indhold.append(element('p', 'Klimazoner farver landene efter Vahls klimazoner og plantebælter eller efter Köppen – vælg i signaturen. Feltet under farverne viser klassen ved musen, eller midt på globussen ved sigtekornet, når du drejer med piletasterne. Laget kan vises sammen med pladegrænserne.'));
  indhold.append(element('p', 'Nedbør farver hele kloden – hav og land – efter den gennemsnitlige nedbør i hver måned (1991–2020). Flyt skyderen, eller tryk Afspil for at se mønstret flytte sig gennem året. Den orange linje viser, hvor solen står i zenit. Søjlerne i signaturen viser året ved musen eller midt på globussen.'));
  indhold.append(element('p', 'Havbund farver havbunden efter alder: rød er dannet ved spredningsryggene inden for de seneste 20 mio. år, violet er ældst. Vælg en profil i signaturen – eller tegn din egen med to tryk på kloden – og flyt markøren på grafen for at måle, hvor hurtigt havbunden har bevæget sig væk fra ryggen.'));
  indhold.append(element('p', 'Jordskælv viser skælv med magnitude 5 eller mere siden 1976, farvet efter dybde; Vulkaner viser vulkaner med udbrud inden for de seneste ca. 11 700 år. Vis dem sammen med pladegrænserne, og brug aflæsningen i signaturen til at se det enkelte skælv eller den enkelte vulkan.'));
  indhold.append(element('p', 'Danmark har også et landekort: vælg Landekort i Danmarks menu eller under Steder. På landekortet flytter træk og piletaster kortet; zoom og Nulstil virker her også. Vælg ← Globus eller Escape for at vende tilbage til din tidligere globusvisning.'));
  indhold.append(element('p', 'Med tastatur: Piletaster drejer globussen, også efter klik andre steder på siden. I søgefelter, dialoger og komponenter med egen piletastbetjening beholder tasterne deres normale funktion. Med fokus på globussen kan du bruge +/− til zoom og Home til at nulstille. Du kan også bruge knapperne under globussen.'));
  indhold.append(element('p', 'Alle modeller kan findes under Steder, Processer og Søg, også når en markør er på bagsiden af Jorden, eller kortet ikke kan vises. Escape lukker et kort og afslutter fokustilstand.'));
  indhold.append(lavInformation({
    navn: 'Globussen', overskrift: 'Om kortet',
    introduktion: 'Oversigtskort – ikke aktuelle vejr- eller klimadata. Pladegrænse- og klimalagene er modeller.',
    tekst: 'Lande og kyster: Natural Earth, forenklet til 1:110 mio. via world-atlas 2.0.2. Grænser er orientering, ikke en stillingtagen til omstridte områder. Globussen viser ikke aktuelle vejr- eller klimadata. Det valgfrie pladegrænselag bygger på Birds model PB2002 fra 2003; kilden står under Pladegrænser → Undersøg og kilde. Klimazonelaget viser klimanormaler for 1991–2020 efter Beck m.fl. (2023); se Klimazoner → Undersøg og kilde. Jordskælv er fra USGS og vulkaner fra Smithsonian GVP; se Jordskælv → Undersøg og kilde. Havbundens alder er en rekonstruktion efter Seton m.fl. (2020); se Havbund → Undersøg og kilde. Nedbørslaget er en klimanormal for 1991–2020 efter GPCP v2.3 (Adler m.fl. 2018); se Nedbør → Undersøg og kilde.'
  }));
};

const PLADEKILDE = 'Pladegrænser: Peter Bird (2003), An updated digital model of plate boundaries, Geochemistry Geophysics Geosystems 4(3), 1027, doi:10.1029/2001GC000252. Data er hentet fra Birds egen side (peterbird.name/oldFTP/PB2002) og er identiske med kopien i github.com/fraxen/tectonicplates, som udgives under Open Data Commons Attribution 1.0. ' +
  'Bird inddeler hvert ca. 45 km langt stykke af grænserne i syv klasser ud fra pladernes beregnede relative bevægelse. Her er de samlet i tre: konstruktiv = pladerne glider fra hinanden, i havet (spredningsryg) eller på land (riftzone); destruktiv = pladerne bevæger sig mod hinanden, enten så den ene glider ned under den anden (subduktion) eller så de presses sammen til bjerge (kollision, fx Himalaya); bevarende = pladerne glider forbi hinanden (transformforkastning). Derfor kan typen skifte flere gange langs den samme grænse. ' +
  'Tænderne viser, hvilken plade der ligger øverst ved subduktion, som Bird har angivet ud fra jordskælvszoner og vulkanbuer. De skraverede områder er brede zoner med fordelt deformation, fx Alperne og Tibet. Der findes ingen enkelt skarp grænse, og linjernes placering er mindre sikker. ' +
  'Grænserne er en geologisk model, ikke skarpe målte linjer, og bevægelserne er beregnet med en ældre pladebevægelsesmodel. Koordinaterne er afrundet til ca. 1 km. Pladenavne og grænsehastigheder kan vælges under Visning. Ved grænserne vises PB2002-modellens lokale relative hastigheder: Fra og Mod er den samlede åbning eller lukning på tværs af grænsen, ikke halvspredning eller hastigheden af én plade. Langs er forskydningen langs transformforkastninger. Ved skrå bevægelse findes begge komponenter i teksttabellen. Tallene er modelværdier, ikke aktuelle GPS-målinger, og kan variere langs samme grænse. Pilene viser kun retning og har ingen hastighedsskala. I diffuse zoner mærkes tal med ≈, fordi grænse og pladebevægelse er mere usikre. Langs den hypotetiske Shetlandplade vises ingen hastighed. Jordskælv og vulkaner er særskilte lag med observerede data.';

const KLIMAKILDE = 'Data: Beck, H. E., McVicar, T. R., Vergopolan, N. m.fl. (2023), High-resolution (1 km) Köppen-Geiger maps for 1901–2099 based on constrained CMIP6 projections, Scientific Data 10, 724, doi:10.1038/s41597-023-02549-6. Datasættet (figshare 21789074) udgives under CC BY 4.0. ' +
  'Köppen-laget er Becks egne klasser for perioden 1991–2020 i 0,1° opløsning (ca. 10 km). Vahl-laget er beregnet til atlasset ud fra samme kildes månedsnormaler for temperatur og nedbør 1991–2020 i 0,5° opløsning (ca. 50 km) med skolekriterierne ovenfor. Det er altså en rekonstruktion: Vahl selv (1911 og senere) afgrænsede plantebælterne bl.a. med regnsandsynlighed og skrå grænselinjer, som ikke kan beregnes ud fra månedsnormaler. ' +
  'Bearbejdning: Enkeltceller er udglattet med et flertalsfilter, og grænserne er forenklet med fælles kanter. Havceller har fået nærmeste landklasse, og laget klippes med atlassets egen kystlinje (Natural Earth); meget små øer uden egne data får derfor naboområdets klasse. Bjerge får deres faktiske, koldere klima, fx i Andes og Tibet. Laget viser klimanormaler – ikke vejret et bestemt år og ikke den faktiske vegetation, som også afhænger af jordbund og menneskers arealanvendelse.';

function visKlimaopgave() {
  aabn('Undersøg klimazonerne');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Slå laget Klimazoner til, og skift mellem Vahl og Köppen i signaturen. Aflæsningen under farverne viser klassen ved musen eller midt på globussen (sigtekornet), når du drejer med piletasterne.'));
  const vahl = element('details', '', 'klimakriterier');
  vahl.open = true;
  vahl.append(element('summary', 'Sådan er Vahl-kortet lavet'));
  const regler = element('ul');
  for (const tekst of [
    'v = varmeste måneds middeltemperatur, k = koldeste måneds middeltemperatur.',
    'Polar zone: v < 10 °C. Tundra; is, hvis v < 0 °C.',
    'Tropisk zone: k > 15 °C (ingen frost).',
    'Subtropisk zone: v > 20 °C og k > 5 °C.',
    'Tempereret zone: resten, dvs. v ≥ 10 °C.',
    'En måned er fugtig, når nedbøren i mm er større end 2 × temperaturen i °C – som når nedbørssøjlen rager op over temperaturkurven i en hydrotermfigur.',
    'Plantebælte efter antal fugtige måneder: 10–12 skov (tropisk regnskov, subtropisk skov, løvskov/nåleskov), 3–9 savanne eller steppe, 1–2 busksteppe, 0 ørken.',
    'Tempereret zone: Her tæller vækstsæsonen – månederne over 5 °C – fordi en frostmåned altid er «fugtig» efter reglen ovenfor. Vahl lagde selv grænsen mellem skov og græssteppe efter regnen i månederne over 5 °C. Skov kræver 10–12 fugtige måneder og ingen tør måned i vækstsæsonen (undtagen ved mindst 700 mm årsnedbør, hvor jorden kan dække en kort sommertørke). Ellers: 3 eller flere fugtige måneder i vækstsæsonen steppe, 1–2 busksteppe, 0 ørken.',
    'Maki: subtropisk med 3–9 fugtige måneder, hvor de tre varmeste måneder alle er tørre (vinterregn).',
    'Nåleskov eller løvskov: Vahls grænse v = 16,2 − 0,3 · k. Er sommeren koldere end det, bliver det nåleskov.'
  ]) regler.append(element('li', tekst));
  vahl.append(regler);
  vahl.append(element('p', 'Grænserne mellem zonerne er ikke skarpe i naturen, og lærebøgerne bruger lidt forskellige tal (fx 14–16 °C for den tropiske grænse). Steppen i Kasakhstan og Mongoliet og de kolde ørkener i Centralasien kommer med, fordi kun vækstsæsonen tælles i den tempererede zone. Prærien i Nordamerika bliver stadig skov: Sommerregnen er stor nok efter N > 2T, og græsset skyldes også tørkeår, præriebrande og græsning, som klimanormaler ikke viser. Med k > 15 °C bliver det midterste Florida tropisk.', 'antal'));
  const koppen = element('details', '', 'klimakriterier');
  koppen.append(element('summary', 'Köppen-Geiger kort fortalt'));
  const koppenregler = element('ul');
  for (const tekst of [
    'A tropisk: koldeste måned ≥ 18 °C. f = ingen tørtid, m = monsun, w = tør vinter.',
    'B tørt: nedbøren er mindre end en tærskel, der stiger med temperaturen. W = ørken, S = steppe; h = varm, k = kold.',
    'C tempereret: koldeste måned mellem 0 og 18 °C. D koldt: koldeste måned ≤ 0 °C og varmeste > 10 °C.',
    'Andet bogstav: s = tør sommer, w = tør vinter, f = ingen tørtid. Tredje bogstav: a = hed, b = varm, c = kølig sommer, d = meget kold vinter.',
    'E polart: varmeste måned < 10 °C. T = tundra, F = evig frost.'
  ]) koppenregler.append(element('li', tekst));
  koppen.append(koppenregler);
  indhold.append(vahl, koppen, element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Følg en længdekreds fra Ækvator mod nord gennem Afrika og Europa. Hvilke plantebælter passerer du, og hvorfor kommer de i den rækkefølge?',
    'Hvorfor ligger de store ørkener omkring 20–30° nord og syd? Brug den globale atmosfæriske cirkulation i din forklaring.',
    'Sammenlign vestkysten og østkysten af et kontinent på samme breddegrad, fx Portugal og Kina eller Chile og Argentina. Hvad er forskellen, og hvad skyldes den?',
    'Find Danmark. Hvilken zone og hvilket plantebælte er Danmark i efter Vahl, og hvilken klimatype efter Köppen? Kontrollér med en hydrotermfigur under landets Klima-fane.',
    'Find et sted, hvor Vahl og Köppen giver forskellige svar, fx steppen i Kasakhstan eller det sydøstlige USA. Hvilke kriterier giver forskellen?',
    'Modelkritik: Kortet viser klima, ikke den vegetation der faktisk vokser. Nævn tre grunde til, at de to kan være forskellige.'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  indhold.append(lavInformation({
    navn: 'Klimazoner', overskrift: 'Om data',
    introduktion: 'Beck m.fl. (2023), klimanormaler 1991–2020. Vahl-laget er en rekonstruktion med skolekriterierne.',
    tekst: KLIMAKILDE
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['Beck m.fl. (2023)', 'https://doi.org/10.1038/s41597-023-02549-6'],
    ['Data (figshare)', 'https://doi.org/10.6084/m9.figshare.21789074'],
    ['CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'],
    ['Vahls klimainddeling (Geografisk Tidsskrift)', 'https://tidsskrift.dk/geografisktidsskrift/article/view/48397']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
  if (globus && klimaknap.getAttribute('aria-pressed') !== 'true') {
    const vis = element('button', 'Slå klimazonerne til', 'tilbage');
    vis.onclick = async () => {
      senesteFokus = klimaknap;
      dialog.close();
      await klimalaget.slaaTil();
    };
    indhold.append(vis);
  }
  indhold.append(element('h3', 'Undersøg processerne i en model', 'underoverskrift'));
  indhold.append(visModeller(modeller.filter(model => ['Global atmosfære', 'Vejr og klima'].includes(model.emne))));
  indhold.append(visOevelser(oevelserTil('opgaver', 'klima')));
}

const SKAELVKILDE = 'Jordskælv: U.S. Geological Survey, Earthquake Hazards Program, ANSS Comprehensive Earthquake Catalog (ComCat), hentet 15. oktober 2026 via earthquake.usgs.gov/fdsnws. USGS-data er offentligt domæne (public domain). ' +
  'Udtrækket er alle hændelser af typen jordskælv med magnitude 5,0 eller mere fra 1976 til og med 2025 – i alt 83 469. 1976 er valgt, fordi det globale CMT-katalog begynder da, så store skælv er mere ensartet registreret. Mindre skælv er udeladt; de findes overalt og ville skjule mønsteret. ' +
  'Bearbejdning: Positionen er afrundet til 0,1° (ca. 10 km), dybden til hele km og magnituden til 0,1. Magnituden er katalogets foretrukne, oftest momentmagnitude (Mw). Mange lavtliggende skælv har en fastsat standarddybde på 10 eller 33 km, fordi dybden ikke kunne bestemmes præcist; dybdegrænserne 70 og 300 km er den gængse inddeling i lavtliggende, mellemdybe og dybe skælv.';

const VULKANKILDE = 'Vulkaner: Global Volcanism Program, Smithsonian Institution, Volcanoes of the World (VOTW) version 5.4.0 af 7. august 2026, kompileret af E. Venzke, doi:10.5479/si.GVP.VOTW5-2026.5.4; laget Holocene Volcanoes, hentet 15. oktober 2026 fra GVP\'s WFS-tjeneste (webservices.volcano.si.edu). Kilden skal angives ved brug. ' +
  'Listen rummer 1 214 vulkaner med udbrud eller anden sikker aktivitet i holocæn, dvs. inden for ca. 11 700 år. Vulkantypen er GVP\'s primære type, samlet i ni danske typer. Tektonisk placering er GVP\'s egen: subduktionszone, riftzone eller intraplade (inde på en plade, fx over en hotspot). ' +
  'En fyldt trekant betyder, at GVP har registreret et udbrud i 1900 eller senere. Vulkanfelter og sprækkesystemer er vist som ét punkt, selv om de dækker et område. Vulkaner under havet er kun med, hvis der kendes holocæn aktivitet; langt de fleste udbrud langs spredningsryggene sker på dybt vand og er ikke registreret.';

function visSeismikopgave() {
  aabn('Undersøg jordskælv og vulkaner');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Slå lagene Jordskælv, Vulkaner og Pladegrænser til samtidig. Aflæsningen i signaturen viser det skælv eller den vulkan, der ligger ved musen – eller midt på globussen ved sigtekornet, når du drejer med piletasterne. Med dybdefelterne kan du skjule en dybde ad gangen.'));
  const tekst = element('details', '', 'pladeoversigt');
  tekst.open = !globus;
  tekst.append(element('summary', 'Mønstret i tekst'));
  const punkter = element('ul');
  for (const linje of [
    'Langt de fleste store skælv og vulkaner ligger i smalle bælter langs pladegrænserne – især rundt om Stillehavet («ildringen»).',
    'Ved spredningsrygge og riftzoner, fx den Midtatlantiske Ryg og Island, er skælvene lavtliggende (under 70 km), og der er vulkaner, hvor ryggen når op over havet.',
    'Ved subduktionszoner, fx Japan, Tonga og Andesbjergene, bliver skælvene dybere, jo længere man går ind over den overliggende plade. De dybeste ligger ned til ca. 700 km. Vulkanerne står i en bue på den overliggende plade.',
    'Ved bevarende grænser, fx San Andreas, er der lavtliggende skælv, men næsten ingen vulkaner. Ved kontinentkollision, fx Himalaya, er skælvene spredt over et bredt område og der er næsten ingen vulkaner.',
    'Enkelte vulkaner ligger langt fra pladegrænserne, fx på Hawaii. De forklares med hotspots.'
  ]) punkter.append(element('li', linje));
  tekst.append(punkter);
  indhold.append(tekst, element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Beskriv, hvor jordskælvene ligger på kloden. Sammenlign med pladegrænserne: Hvilke grænsetyper har flest skælv?',
    'Find Island. Hvor dybe er skælvene her, og hvilken type pladegrænse passer det med? Hvorfor ligger der så mange vulkaner netop på Island?',
    'Find Japan eller Sydamerikas vestkyst. Skjul de lavtliggende skælv. Hvilken vej bliver skælvene dybere – og hvad fortæller det om den plade, der subducerer?',
    'Hvor ligger vulkanerne i forhold til de destruktive grænser? Hvorfor ligger de ikke lige på grænsen, men et stykke inde over den overliggende plade?',
    'Find en vulkan langt fra en pladegrænse, fx på Hawaii. Hvordan kan den forklares?',
    'Modelkritik: Hvorfor er der langs spredningsryggene i havet mange skælv men få vulkaner på kortet? Og hvorfor kan et kort over 50 år ikke vise alle steder, hvor der kan komme store skælv?'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  const tal = element('details', '', 'pladeoversigt');
  tal.append(element('summary', 'Tal fra datasættene'));
  const talindhold = element('div');
  tal.append(talindhold);
  tal.addEventListener('toggle', async () => {
    if (!tal.open || talindhold.childElementCount) return;
    talindhold.textContent = 'Henter data …';
    try {
      const [skaelv, vulkaner] = await Promise.all([import('./jordskaelv.js'), import('./vulkaner.js')]);
      await Promise.all([skaelv.hent(), vulkaner.hent()]);
      const ul = element('ul');
      const ialt = skaelv.optaelling().reduce((sum, d) => sum + d.antal, 0);
      for (const d of skaelv.optaelling()) {
        ul.append(element('li', `${d.navn} skælv (${d.interval}): ${d.antal.toLocaleString('da')} – ${Math.round(d.antal / ialt * 100)} %`));
      }
      const v = vulkaner.optaelling();
      ul.append(element('li', `Vulkaner: ${v.i_alt.toLocaleString('da')}, heraf ${v.nylige} med udbrud siden 1900. Ved subduktionszoner: ${v.subduktion}, i riftzoner: ${v.rift}, inde på en plade: ${v.intraplade}.`));
      talindhold.replaceChildren(element('p', `Jordskælv med M ≥ 5, 1976–2025: ${ialt.toLocaleString('da')}.`), ul);
    } catch {
      talindhold.textContent = 'Data kunne ikke hentes. Forklaringen og opgaverne kan stadig bruges. Luk og åbn igen for at prøve igen.';
    }
  });
  indhold.append(tal);
  indhold.append(lavInformation({
    navn: 'Jordskælv og vulkaner', overskrift: 'Om data',
    introduktion: 'Observerede kataloger: USGS (jordskælv) og Smithsonian GVP (vulkaner). Punkterne er målte eller registrerede hændelser, ikke en model.',
    tekst: `${SKAELVKILDE} ${VULKANKILDE}`
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['USGS ComCat', 'https://earthquake.usgs.gov/data/comcat/'],
    ['USGS: brug af data', 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits'],
    ['Smithsonian GVP', 'https://volcano.si.edu/'],
    ['VOTW 5.4.0 (DOI)', 'https://doi.org/10.5479/si.GVP.VOTW5-2026.5.4'],
    ['GVP: brug af data', 'https://volcano.si.edu/gvp_termsofuse.cfm']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
  if (globus) {
    const find = element('button', 'Vis Island med skælv, vulkaner og pladegrænser', 'tilbage');
    find.onclick = async () => {
      tilbageTilGlobus(false);
      senesteFokus = document.querySelector('#globus');
      dialog.close();
      await Promise.all([pladelaget.slaaTil(), skaelvlaget.slaaTil(), vulkanlaget.slaaTil()]);
      globus.visSted(steder.find(sted => sted.id === 'island'));
      document.querySelector('#globus').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(visModeller(modeller.filter(model => model.emne === 'Seismiske bølger')));
  indhold.append(visOevelser(oevelserTil('opgaver', 'seismik')));
}

const HAVBUNDKILDE = 'Havbundens alder: Seton, M., Müller, R. D., Zahirovic, S., Williams, S., Wright, N. M., Cannon, J., Whittaker, J. M., Matthews, K. J. & McGirr, R. (2020), A global dataset of present-day oceanic crustal age and seafloor spreading parameters, Geochemistry, Geophysics, Geosystems 21, e2020GC009214, doi:10.1029/2020GC009214. Gitteret (age.2020.1.GeeK2007, 6 bueminutter) udgives frit af EarthByte-gruppen ved University of Sydney med krav om kildeangivelse. Atlassets kopi er taget fra pyBacktrack 1.5.0, som indeholder den samme fil uændret. ' +
  'Sådan er alderen fundet: Når lava størkner ved en spredningsryg, låses jordmagnetfeltets retning fast i mineralet magnetit. Feltet vender med ujævne mellemrum, så havbunden får magnetiske striber parallelt med ryggen. Striberne er målt fra skibe og fly, genkendt og dateret efter den geomagnetiske tidsskala (GTS2012), som bygger på boringer i havbunden og radiometrisk datering. Mellem striberne er alderen interpoleret, og hvor striberne mangler, bruges en pladerekonstruktion. Alderen er altså en rekonstruktion – ikke en måling i hvert punkt. ' +
  'Usikkerheden er størst i kridttidens «stille zone» (ca. 121–84 mio. år siden, hvor feltet ikke vendte, så der ingen striber er), hvor få skibe har sejlet, og i små, gamle bassiner som Østmiddelhavet. ' +
  'Bearbejdning til atlasset: 2 × 2 celler er samlet til 0,2° (ca. 22 km), og alderen er afrundet til 0,2 mio. år. Aflæsning og profil interpolerer mellem cellerne. Farverne er 11 klasser på 20 mio. år (ColorBrewer Spectral); grå havbund har ingen havbundsalder – den er kontinental skorpe (fx Nordsøen) eller mangler data. Landfladerne dækker gitteret. ' +
  'Profilerne følger en storcirkel mellem A og B. Ryggen er profilens yngste punkt, hvis det er under 5 mio. år. Hastigheden er afstanden fra ryggen divideret med alderen, altså gennemsnittet siden havbunden blev dannet – og kun den del af bevægelsen, der går langs profilen. Går profilen skråt over ryggen, bliver afstanden og dermed hastigheden for stor.';

function visHavbundsopgave() {
  aabn('Undersøg havbundens alder');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Slå laget Havbund til – gerne sammen med Pladegrænser. Aflæsningen i signaturen viser alderen ved musen eller midt på globussen ved sigtekornet. Vælg en profil, og flyt markøren på grafen med mus, finger eller piletaster.'));
  const tekst = element('details', '', 'pladeoversigt');
  tekst.open = !globus;
  tekst.append(element('summary', 'Mønstret i tekst'));
  const punkter = element('ul');
  for (const linje of [
    'Den yngste havbund (rød, under 20 mio. år) ligger i smalle bånd langs spredningsryggene: midt i Atlanterhavet, i Det Indiske Ocean og i det østlige Stillehav.',
    'Alderen stiger til begge sider af ryggen, næsten symmetrisk. I Atlanterhavet ligger den ældste havbund ved kontinenterne – ca. 180–190 mio. år (jura) ud for USA’s østkyst og Vestafrika.',
    'I det østlige Stillehav er båndene mange gange bredere end i Atlanterhavet: Østpacifiske Ryg spreder hurtigere.',
    'Den ældste havbund i oceanerne er ca. 190 mio. år og ligger i det vestlige Stillehav øst for Marianergraven. Kun i Østmiddelhavet findes rester, der kan være op til ca. 340 mio. år gamle.',
    'Der findes ingen havbund, der er meget ældre end 200 mio. år, selv om de ældste bjergarter på kontinenterne er ca. 4 mia. år.',
    'Grå havbund har ingen havbundsalder: Det er kontinental skorpe under havet, fx Nordsøen og sokkelen rundt om kontinenterne.'
  ]) punkter.append(element('li', linje));
  tekst.append(punkter);
  const maal = element('details', '', 'pladeoversigt');
  maal.append(element('summary', 'Sådan måler du spredningshastigheden'));
  for (const linje of [
    'Flyt markøren på profilgrafen ud til et punkt på den ene side af ryggen. Aflæs afstanden fra ryggen (km) og havbundens alder (mio. år).',
    'Hastigheden er afstand / tid. 1 km pr. mio. år er 1 000 000 mm / 1 000 000 år = 1 mm/år = 0,1 cm/år. Fx 1 000 km / 50 mio. år = 20 km pr. mio. år = 2 cm/år.',
    'Det er den halve spredningshastighed: så hurtigt har den ene side bevæget sig væk fra ryggen i gennemsnit. Den samlede spredning – hvor hurtigt de to plader bevæger sig fra hinanden – er summen af de to sider, ca. det dobbelte.',
    'Grafens rette, violette linje går fra ryggen til markøren. Jo fladere den er, jo hurtigere spredning.'
  ]) maal.append(element('p', linje));
  indhold.append(tekst, maal, element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Beskriv mønstret: Hvor er havbunden yngst, og hvor er den ældst? Slå Pladegrænser til. Hvilken type pladegrænse ligger ved den yngste havbund?',
    'Vælg profilen Sydatlanten. Beskriv aldersprofilen på hver side af ryggen. Hvad fortæller symmetrien om, hvordan havbunden dannes?',
    'Mål den halve spredningshastighed i Sydatlanten og ved Østpacifiske Ryg. Hvor mange gange hurtigere går det i Stillehavet? Hvordan kan man se forskellen på kortet uden at måle?',
    'Slå Pladegrænser → Visning → bevægelse til. PB2002 viser den samlede åbning ved ryggen nu. Passer den med cirka to gange din halve hastighed? Hvorfor behøver tallene ikke passe helt?',
    'Profilen ved Østpacifiske Ryg slutter ud for Peru, hvor havbunden er ca. 45–50 mio. år. Hvad sker der med den? Slå Jordskælv til, og forklar, hvorfor der ikke findes havbund, der er meget ældre end 200 mio. år.',
    'Vælg Reykjanesryggen syd for Island. Hvor langt er der fra ryggen til havbund, der er 50 mio. år gammel – og hvornår begyndte Nordatlanten altså at åbne sig her? Hvorfor har Island selv ingen havbundsalder på kortet?',
    'Tegn din egen profil på tværs af en ryg, du selv vælger. Sammenlign hastigheden på de to sider. Er spredningen symmetrisk?',
    'Modelkritik: Alderen er ikke målt i hvert punkt. Hvordan er den fundet, og hvor er den mest usikker? Hvad sker der med den målte hastighed, hvis profilen går skråt over ryggen?'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  if (globus) {
    const find = element('button', 'Vis Sydatlanten med profil og pladegrænser', 'tilbage');
    find.onclick = async () => {
      tilbageTilGlobus(false);
      senesteFokus = document.querySelector('#profilgraf');
      dialog.close();
      await Promise.all([pladelaget.slaaTil(), havbundlaget.slaaTil()]);
      havbundsprofil?.vaelg('sydatlanten');
      document.querySelector('#profilgraf').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(lavInformation({
    navn: 'Havbundens alder', overskrift: 'Om data',
    introduktion: 'Seton m.fl. (2020). Alderen er rekonstrueret ud fra magnetiske striber og pladerekonstruktion – ikke dateret punkt for punkt.',
    tekst: HAVBUNDKILDE
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['Seton m.fl. (2020)', 'https://doi.org/10.1029/2020GC009214'],
    ['EarthByte: aldersgitre', 'https://www.earthbyte.org/webdav/ftp/earthbyte/agegrid/2020/'],
    ['pyBacktrack 1.5.0', 'https://pypi.org/project/pybacktrack/1.5.0/'],
    ['ColorBrewer', 'https://colorbrewer2.org/']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
  indhold.append(element('h3', 'Undersøg processerne i en model', 'underoverskrift'));
  indhold.append(visModeller(modeller.filter(model => ['pladegraenser', 'vulkanudbrud', 'bjergarternes-kredsloeb'].includes(model.id))));
  indhold.append(visOevelser(oevelserTil('opgaver', 'plade')));
}

const NEDBOERKILDE = 'Data: GPCP Monthly Version 2.3 (Global Precipitation Climatology Project), NOAA Climate Data Record. Adler, R. F., Sapiano, M. R. P., Huffman, G. J. m.fl. (2018), The Global Precipitation Climatology Project (GPCP) Monthly Analysis (New Version 2.3) and a Review of 2017 Global Precipitation, Atmosphere 9(4), 138, doi:10.3390/atmos9040138. Dataserien: Adler, R., Sapiano, M., Wang, J.-J. & NOAA CDR Program (2016), NOAA Climate Data Record (CDR) of Precipitation – GPCP Monthly, Version 2.3, NOAA NCEI, doi:10.7289/V56971M6. Data er offentlige og må bruges uden begrænsninger; atlassets kopi er hentet fra NOAA’s åbne spejl på Amazon Web Services (noaa-cdr-precip-gpcp-monthly-pds). ' +
  'Sådan er nedbøren målt: Over land bruges målinger fra tusindvis af regnmålere, samlet af GPCC (Tysklands vejrtjeneste). Over havet og i områder uden stationer beregnes nedbøren fra satellitter: mikrobølger fra skyernes regndråber og iskrystaller og infrarøde målinger af kolde skytoppe. Satellitværdierne justeres efter regnmålerne, hvor de findes. Regnmålere fanger for lidt nedbør i blæst og som sne; GPCP korrigerer for det, så tallene for fx Danmark er lidt højere end DMI’s målte normaler (ca. 760 mm på et år for landet som helhed). ' +
  'Bearbejdning til atlasset: For hver kalendermåned er de 30 år 1991–2020 lagt sammen til et gennemsnit (en klimanormal, samme periode som Klimazoner) og regnet om fra mm pr. døgn til mm pr. måned. Hver celle er 2,5° × 2,5° – ca. 280 km ved ækvator – og værdien er et gennemsnit for hele cellen. Kortet og aflæsningen glider (interpolerer) mellem cellernes midtpunkter. Derfor ses små ørkener ved kysten, regnskygger bag bjerge og meget våde bjergskråninger ikke: Fx blandes Atacamaørkenen med det fugtigere Andes, og Mumbai med det tørre indland. Under afspilning glider farverne og zenitlinjen jævnt fra den ene måneds gennemsnit mod den næstes (et år på 30 sekunder); billederne mellem to måneder er altså en overgang, ikke data. Navnet i signaturen skifter halvvejs, og aflæsningens tal er altid den viste måneds egne. ' +
  'Solens zenitbredde er beregnet for den 15. i måneden (Spencer 1971). Farverne er 10 klasser i mm pr. måned, valgt så grænserne passer med klimadiagrammer.';

function visNedboersopgave() {
  aabn('Undersøg nedbøren måned for måned');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Slå laget Nedbør til. Flyt månedsskyderen, eller tryk Afspil for at se et helt år. Aflæsningen viser nedbøren ved musen eller midt på globussen ved sigtekornet, og søjlerne viser punktets år – som nedbørssøjlerne i et klimadiagram.'));
  const tekst = element('details', '', 'pladeoversigt');
  tekst.open = !globus;
  tekst.append(element('summary', 'Mønstret i tekst'));
  const punkter = element('ul');
  for (const linje of [
    'Et bælte med meget nedbør (over 200 mm pr. måned) går rundt om Jorden nær ækvator: den intertropiske konvergenszone (ITK). Over Atlanterhavet og Stillehavet ligger det hele året lidt nord for ækvator (ca. 3–9° N).',
    'Over kontinenterne flytter bæltet sig langt med solen: Over Afrika ligger det ca. 13° S i januar og 11° N i juli–august; over Sydasien flytter det fra syd for ækvator til ca. 20° N i juli–august (monsunen). Det følger solens zenitstand en til to måneder forsinket.',
    'Ved ca. 15–30° nord og syd ligger de store ørkener: Sahara, Arabien, Kalahari og Namib, Australien og Atacama. De får under 10 mm i de fleste måneder.',
    'Middelhavet, Californien, Chile og Sydvestaustralien får regn om vinteren og er tørre om sommeren.',
    'På 40–60° bredde regner det hele året, mest over havet og på vestkysterne. Bergen får over 200 mm i vintermånederne, Danmark 50–90 mm i hver måned med mest i sensommeren og efteråret.',
    'Steder i troperne har tydelige regn- og tørtider: Niamey (Niger) får næsten al nedbør i juni–september, Darwin (Australien) i december–marts, og Lagos (Nigeria) har to regntider med en pause i august.'
  ]) punkter.append(element('li', linje));
  tekst.append(punkter);
  indhold.append(tekst, element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Afspil et helt år. Beskriv, hvordan bæltet med meget nedbør ved ækvator flytter sig. Sammenlign med den orange linje, der viser, hvor solen står i zenit. Hvorfor følger regnen solen – og hvorfor er den lidt forsinket?',
    'Bæltet flytter sig meget mere over Afrika og Sydasien end over Atlanterhavet og Stillehavet. Hvad er forskellen på, hvordan land og hav opvarmes?',
    'Find Indien i januar og i juli. Beskriv forskellen, og forklar monsunen med vindenes retning og havets og landets temperatur.',
    'Følg Sahel lige syd for Sahara (fx Niamey) gennem året. Hvor mange måneder får over 50 mm? Hvad betyder regntidens længde for landbruget – og hvad sker der, hvis ITK et år ikke når så langt nordpå?',
    'Lagos ved Guineabugten har to regntider. Brug solens zenitstand til at forklare hvorfor.',
    'Hvorfor er der ørkener omkring 20–30° nord og syd – også i månederne, hvor solen står højt? Brug den globale atmosfæriske cirkulation (Hadley-cellen) i din forklaring.',
    'Sammenlign Rom og København. Hvornår regner det mest hvert sted? Slå Klimazoner (Vahl) til, og find maki. Hvordan hænger tør sommer og regnfuld vinter sammen med højtrykket, der flytter sig nordpå om sommeren?',
    'Find Danmark og Norges vestkyst i januar. Hvorfor får Bergen så meget mere nedbør end København? Brug vestenvinden, fronter og stigningsregn i din forklaring.',
    'Modelkritik: Hver celle er ca. 280 km bred, og tallet er et gennemsnit for hele cellen. Hvorfor viser kortet nedbør i Atacamaørkenen, som er en af de tørreste steder på Jorden? Hvordan kan man måle nedbør midt på havet, hvor der ingen regnmålere er?'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  if (globus) {
    const find = element('button', 'Vis Afrika og Sydasien i juli med nedbør', 'tilbage');
    find.onclick = async () => {
      tilbageTilGlobus(false);
      senesteFokus = document.querySelector('#nedboerspil');
      dialog.close();
      await nedboerlaget.slaaTil();
      nedboerstyring?.visMaaned(6);
      globus.visUdsnit([45, 8], 1);
      document.querySelector('#nedboerspil').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(lavInformation({
    navn: 'Nedbør måned for måned', overskrift: 'Om data',
    introduktion: 'GPCP v2.3: satellitter og regnmålere, gennemsnit for 1991–2020 i celler på 2,5° (ca. 280 km).',
    tekst: NEDBOERKILDE
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['Adler m.fl. (2018)', 'https://doi.org/10.3390/atmos9040138'],
    ['GPCP v2.3 (datasæt)', 'https://doi.org/10.7289/V56971M6'],
    ['NOAA’s klimadataserier (CDR)', 'https://www.ncei.noaa.gov/products/climate-data-records/atmospheric'],
    ['Data på AWS', 'https://registry.opendata.aws/noaa-cdr-atmospheric/']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
  indhold.append(element('h3', 'Undersøg processerne i en model', 'underoverskrift'));
  indhold.append(visModeller(modeller.filter(model => ['stigningsregn', 'drivhus-enkel'].includes(model.id))));
  indhold.append(visOevelser(oevelserTil('opgaver', 'klima')));
}

function visPladeopgave() {
  aabn('Undersøg pladegrænserne');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Brug det valgfrie lag Pladegrænser og signaturforklaringen. Du kan også åbne tekstoversigten med eksempler på modellens typer.'));
  const oversigt = element('details', '', 'pladeoversigt');
  oversigt.open = !globus;
  oversigt.append(element('summary', 'Modellen i tekst'));
  const eksempler = element('ul');
  for (const eksempel of [
    'Konstruktiv – pladerne bevæger sig fra hinanden. Eksempel: den Midtatlantiske Ryg ved Island mellem den Nordamerikanske og den Eurasiske Plade.',
    'Destruktiv – pladerne bevæger sig mod hinanden. Ved Andesbjergene subducerer Nazcapladen under den Sydamerikanske Plade; ved Himalaya kolliderer kontinenter.',
    'Bevarende – pladerne glider forbi hinanden. Eksempel: San Andreas-forkastningen mellem Stillehavspladen og den Nordamerikanske Plade.',
    'Bred, diffus zone – deformationen er fordelt over et område, fx Alperne og Tibet. Skraveringen markerer den brede zone frem for én skarp grænse.'
  ]) eksempler.append(element('li', eksempel));
  oversigt.append(eksempler);
  indhold.append(oversigt, element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Hvor ligger de konstruktive grænser mest – på land eller i havet? Hvor ligger de destruktive?',
    'Find Island. Hvilken type pladegrænse går gennem øen, og hvilke to plader bevæger sig fra hinanden her?',
    'Følg den Midtatlantiske Ryg mod syd. Hvorfor er den delt op i korte stykker med bevarende grænser imellem?',
    'Find en destruktiv grænse med tænder, fx ved Japan eller Andesbjergene. Hvilken plade ligger øverst, og hvilke landformer og hvilken aktivitet vil du forvente der?',
    'Langs den Midtatlantiske Ryg dannes ny havbund, men det meste af ryggen ligger dybt under havet. Hvorfor kan pladegrænsen alene ikke forklare, at Island ligger over havet?',
    'Modelkritik: Laget tegner grænserne som skarpe linjer. Hvorfor er det en forenkling? Se fx de skraverede områder ved Alperne og Tibet.'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  const tabel = element('details', '', 'pladetabeloversigt');
  tabel.append(element('summary', 'Alle pladenavne'));
  const tabelindhold = element('div');
  tabel.append(tabelindhold);
  tabel.addEventListener('toggle', async () => {
    if (!tabel.open || tabelindhold.childElementCount) return;
    tabelindhold.textContent = 'Henter pladedata …';
    try {
      const modul = await import('./pladebevaegelse.js');
      const plader = await modul.hentPlader();
      const t = element('table', '', 'pladetabel');
      t.id = 'pladenavnetabel';
      t.append(element('caption', 'De 52 plader i PB2002. Pladerne omfatter både land og havbund.'));
      const top = element('tr');
      for (const tekst of ['Plade', 'Kode']) {
        const h = element('th', tekst); h.scope = 'col'; top.append(h);
      }
      const hoved = element('thead'); hoved.append(top); t.append(hoved);
      const krop = element('tbody');
      for (const p of [...plader].sort((a, b) => a.navn.localeCompare(b.navn, 'da'))) {
        const raekke = element('tr'), navn = element('th', p.navn); navn.scope = 'row';
        raekke.append(navn, element('td', p.id)); krop.append(raekke);
      }
      t.append(krop); tabelindhold.replaceChildren(t);
    } catch {
      tabelindhold.textContent = 'Pladedata kunne ikke hentes. De øvrige forklaringer og simulationer kan stadig bruges. Luk og åbn listen for at prøve igen.';
    }
  });
  indhold.append(tabel, lavGraenseoversigt());
  indhold.append(lavInformation({
    navn: 'Pladegrænser', overskrift: 'Om data',
    introduktion: 'Peter Birds model PB2002 (2003). Grænser og typer er en model – ikke skarpe, målte linjer.',
    tekst: PLADEKILDE
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['Bird (2003)', 'https://doi.org/10.1029/2001GC000252'],
    ['PB2002-originaler', 'https://github.com/fraxen/tectonicplates/tree/339b0c56563c118307b1f4542703047f5f698fae/original'],
    ['ODC-By 1.0', 'https://opendatacommons.org/licenses/by/1-0/']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
  const island = steder.find(sted => sted.id === 'island');
  if (globus) {
    const find = element('button', 'Vis Island med pladegrænser', 'tilbage');
    find.onclick = async () => {
      tilbageTilGlobus(false);
      senesteFokus = document.querySelector('#globus');
      dialog.close();
      await pladelaget.slaaTil();
      globus.visSted(island);
      document.querySelector('#globus').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(element('h3', 'Undersøg processerne i en model', 'underoverskrift'));
  indhold.append(visModeller(modeller.filter(model => model.steder.includes('island'))));
  indhold.append(visOevelser(oevelserTil('opgaver', 'plade')));
}

function lavGraenseoversigt() {
  const oversigt = element('details', '', 'graenseoversigt');
  oversigt.append(element('summary', 'Hastigheder ved pladegrænserne'));
  const indre = element('div'); oversigt.append(indre);
  oversigt.addEventListener('toggle', async () => {
    if (!oversigt.open || indre.childElementCount) return;
    indre.textContent = 'Henter grænsehastigheder …';
    try {
      const [modul, navnemodul] = await Promise.all([import('./graensehastigheder.js'), import('./pladebevaegelse.js')]);
      const [punkter, plader] = await Promise.all([modul.hentGraensehastigheder(), navnemodul.hentPlader()]);
      const navne = Object.fromEntries(plader.map(p => [p.id, p.navn]));
      const par = p => [p.graense.slice(0, 2), p.graense.slice(3, 5)].sort().join('-');
      const grupper = [...new Set(punkter.map(par))].map(id => ({ id,
        navn: id.split('-').map(k => navne[k] || k).join(' / ') })).sort((a, b) => a.navn.localeCompare(b.navn, 'da'));
      const label = element('label', 'Vælg de to plader', 'graensevaelger');
      const valg = element('select');
      for (const gruppe of grupper) { const o = element('option', gruppe.navn); o.value = gruppe.id; valg.append(o); }
      valg.value = 'EU-NA'; label.append(valg);
      const tabelrum = element('div');
      const tegn = () => {
        const t = element('table', '', 'pladetabel graensetabel');
        t.id = 'graensehastighedstabel';
        t.append(element('caption', 'PB2002-model, cm/år mellem de to plader. Fra/mod er samlet åbning/lukning på tværs, ikke halvspredning. Langs er forskydningen langs grænsen. ≈ angiver mere usikre tal i en diffus zone; — angiver den hypotetiske Shetlandmodel.'));
        const hoved = element('thead'), top = element('tr');
        for (const tekst of ['Grænsepunkt', 'På tværs', 'Langs']) { const h = element('th', tekst); h.scope = 'col'; top.append(h); }
        hoved.append(top); t.append(hoved);
        const krop = element('tbody');
        for (const p of punkter.filter(p => par(p) === valg.value).sort((a, b) => b.punkt[1] - a.punkt[1])) {
          const [lon, lat] = p.punkt;
          const raekke = element('tr'), sted = element('th', `${Math.abs(lat).toFixed(1).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'}`);
          sted.scope = 'row'; sted.append(element('small', `${Math.abs(lon).toFixed(1).replace('.', ',')}° ${lon < 0 ? 'V' : 'Ø'}`));
          raekke.dataset.trin = p.trin;
          raekke.append(sted, element('td', p.hypotetisk ? '—' : (p.usikker ? '≈ ' : '') + modul.tvaerstekst(p.aabning)),
            element('td', p.hypotetisk ? '—' : (p.usikker ? '≈ ' : '') + modul.formaterKomponent(p.langs))); krop.append(raekke);
        }
        t.append(krop); tabelrum.replaceChildren(t);
      };
      valg.addEventListener('change', tegn); indre.replaceChildren(label, tabelrum); tegn();
    } catch {
      indre.textContent = 'Grænsehastigheder kunne ikke hentes. Luk og åbn listen for at prøve igen. De øvrige forklaringer og simulationer kan stadig bruges.';
    }
  });
  return oversigt;
}

const pladeknap = document.querySelector('#pladelag');
const signatur = document.querySelector('#signatur');
const canvas = document.querySelector('#globus');
const canvasbeskrivelse = canvas.getAttribute('aria-label');
const pladevalg = { navne: false, bevaegelse: false };
const valgpanel = document.querySelector('#pladevalg');
const valgknap = document.querySelector('#pladevisning');
const navnefelt = document.querySelector('#pladenavne');
const pilefelt = document.querySelector('#pladepile');
const bevaegelsesnote = document.querySelector('#bevaegelsesnote');
const valgstatus = document.querySelector('#pladevalgstatus');

function opdaterPladebeskrivelse() {
  lagmenu?.opdater();
  bevaegelsesnote.hidden = !pladevalg.bevaegelse;
  bevaegelsesnote.textContent = 'cm/år mellem pladerne: samlet åbning/lukning på tværs; forskydning langs transformforkastninger. ≈: diffus zone.';
  document.querySelector('#graenseforklaring').hidden = !pladevalg.bevaegelse;
  canvas.setAttribute('aria-label', landAktivt ? 'Interaktivt Danmarkskort med Jylland, de danske øer inklusive Bornholm og orienteringsbyer. Nord er opad.' : pladeknap.getAttribute('aria-pressed') === 'true'
    ? `${canvasbeskrivelse}. Viser pladegrænser: konstruktive, destruktive og bevarende, efter Bird 2003${pladevalg.navne ? ', med pladenavne' : ''}${pladevalg.bevaegelse ? ' og relative grænsehastigheder i cm/år mellem pladerne' : ''}`
    : canvasbeskrivelse);
  if (!landAktivt && klimaknap.getAttribute('aria-pressed') === 'true') {
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. Viser ${klimasystem === 'vahl' ? 'Vahls klimazoner og plantebælter' : 'Köppen-Geigers klimatyper'} for 1991–2020; aflæsningen under signaturen viser klassen midt på globussen`);
  }
  if (!landAktivt && skaelvknap.getAttribute('aria-pressed') === 'true') {
    const dybder = [...document.querySelectorAll('[name="skaelvdybde"]:checked')].map(f => f.parentElement.textContent.trim());
    const min = document.querySelector('[name="skaelvmin"]:checked').value;
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. Viser jordskælv med magnitude ${min} eller mere fra 1976–2025 efter USGS, farvet efter dybde: ${dybder.join(', ') || 'ingen dybder valgt'}`);
  }
  if (!landAktivt && vulkanknap.getAttribute('aria-pressed') === 'true') {
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. Viser holocæne vulkaner efter Smithsonian GVP; fyldte trekanter har haft udbrud siden 1900`);
  }
  if (!landAktivt && document.querySelector('#havbundlag').getAttribute('aria-pressed') === 'true') {
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. Viser havbundens alder efter Seton m.fl. 2020 i klasser på 20 mio. år; aflæsningen under signaturen viser alderen midt på globussen. ${havbundsprofil?.beskrivelse() || ''}`);
  }
  if (!landAktivt && nedboerknap.getAttribute('aria-pressed') === 'true' && nedboerstyring) {
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. ${nedboerstyring.beskrivelse()}; aflæsningen under signaturen viser nedbøren midt på globussen`);
  }
  // Knappen er først trykket, når temakort.js er hentet.
  if (!landAktivt && document.querySelector('#temalag').getAttribute('aria-pressed') === 'true') {
    const ind = temamodul.indikator();
    canvas.setAttribute('aria-label', `${canvas.getAttribute('aria-label')}. Temakort: landene er farvet efter nøgletallet ${ind.navn} ${temamodul.aarFor(ind)}; aflæsningen under signaturen viser landet midt på globussen, og ranglisten findes under Undersøg`);
  }
}

function placerValgpanel() {
  if (!valgpanel.matches(':popover-open')) return;
  const c = canvas.getBoundingClientRect();
  const kontroltop = document.querySelector('.betjeningslinje').getBoundingClientRect().top;
  valgpanel.style.maxHeight = `${innerWidth >= 900
    ? Math.max(150, kontroltop - c.top - 26) : innerHeight - 24}px`;
  const r = valgpanel.getBoundingClientRect();
  const venstre = innerWidth >= 900 ? c.right - r.width - 14 : (innerWidth - r.width) / 2;
  valgpanel.style.left = `${Math.max(12, Math.min(innerWidth - r.width - 12, venstre))}px`;
  valgpanel.style.top = `${Math.max(12, Math.min(innerHeight - r.height - 12, c.top + 14))}px`;
}
valgpanel.addEventListener('toggle', event => {
  valgknap.setAttribute('aria-expanded', String(event.newState === 'open'));
  placerValgpanel();
  globus?.gentegn();
});
window.addEventListener('resize', placerValgpanel);

async function skiftPladeoplysninger() {
  const ny = { navne: navnefelt.checked, bevaegelse: pilefelt.checked };
  const havdeFokus = document.activeElement;
  for (const felt of [navnefelt, pilefelt]) felt.disabled = true;
  valgstatus.hidden = true;
  valgpanel.setAttribute('aria-busy', 'true');
  try {
    await globus.visPladeoplysninger(ny);
    Object.assign(pladevalg, ny);
  } catch {
    navnefelt.checked = pladevalg.navne; pilefelt.checked = pladevalg.bevaegelse;
    valgstatus.textContent = 'Navne og bevægelser kunne ikke hentes. Pladegrænser og globus virker stadig. Prøv igen, eller genindlæs siden.';
    valgstatus.hidden = false;
  } finally {
    for (const felt of [navnefelt, pilefelt]) felt.disabled = false;
    valgpanel.removeAttribute('aria-busy');
    opdaterPladebeskrivelse(); placerValgpanel();
    if (document.activeElement === document.body && valgpanel.matches(':popover-open')) havdeFokus.focus({ preventScroll: true });
  }
}
for (const felt of [navnefelt, pilefelt]) felt.addEventListener('change', skiftPladeoplysninger);
const pladelaget = lavLag({
  knap: pladeknap, signatur, klasse: 'pladelag',
  fejltekst: 'Pladegrænserne kunne ikke indlæses. Globussen virker stadig. Find tekst, opgave og kilder under Processer → Undersøg pladegrænserne. Prøv igen, eller genindlæs siden, hvis problemet fortsætter.',
  vis: vis => globus.visPladegraenser(Boolean(vis)),
  efter() {
    if (!pladelaget.aktiv && valgpanel.matches(':popover-open')) valgpanel.hidePopover();
    opdaterPladebeskrivelse();
  }
});

// Klimalag: Vahl eller Köppen. Signaturen bygges ud fra klimalag.js, som først
// hentes, når laget slås til.
const klimaknap = document.querySelector('#klimalag');
const klimasignatur = document.querySelector('#klimasignatur');
let klimasystem = 'vahl';
function tegnKlimasignatur(modul) {
  for (const felt of document.querySelectorAll('[name="klimasystem"]')) felt.checked = felt.value === klimasystem;
  const system = modul.SYSTEMER[klimasystem];
  document.querySelector('#klimatitel').textContent = klimasystem === 'vahl' ? 'Klimazoner (Vahl)' : 'Klimatyper (Köppen)';
  document.querySelector('#klimanote').textContent = system.note;
  const grupper = system.grupper.map(([id, navn, kriterie]) => {
    const raekke = element('div', '', 'klimagruppe');
    const titel = element('b', navn);
    if (kriterie) titel.append(element('small', kriterie));
    const felter = element('ul', '', 'klimafelter');
    for (const nr of Object.keys(system.klasser)) {
      const k = modul.klasse(klimasystem, nr);
      if (k.gruppe !== id || !modul.findes(klimasystem, nr)) continue;
      const li = element('li');
      const felt = element('i'); felt.style.background = k.farve;
      li.title = modul.beskriv(klimasystem, nr);
      li.append(felt, k.navn);
      felter.append(li);
    }
    raekke.append(titel, felter);
    return raekke;
  });
  if (klimasystem === 'vahl') {
    const zone = element('div', '', 'klimagruppe');
    const felter = element('ul', '', 'klimafelter');
    const li = element('li');
    li.innerHTML = '<svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true"><path d="M1 5h22" stroke="#17211f" stroke-width="1.6" stroke-dasharray="6 3"/></svg> Grænse mellem zoner';
    felter.append(li);
    zone.append(element('b', ''), felter);
    grupper.push(zone);
  }
  document.querySelector('#klimaforklaring').replaceChildren(...grupper);
}
const klimalaget = lavLag({
  knap: klimaknap, signatur: klimasignatur, klasse: 'klimalag', standard: 'vahl',
  fejltekst: 'Klimazonerne kunne ikke indlæses. Globussen virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(system) {
    // Klimazoner og temakort farver begge landfladerne; kun ét ad gangen.
    if (system && temalaget.aktiv) await temalaget.skift(null);
    if (system && nedboerlaget.aktiv) await nedboerlaget.skift(null);
    const [modul] = await Promise.all([import('./klimalag.js'), globus.visKlimalag(system)]);
    if (system) { klimasystem = system; tegnKlimasignatur(modul); }
  },
  fejl() { for (const felt of document.querySelectorAll('[name="klimasystem"]')) felt.checked = felt.value === klimasystem; },
  efter: opdaterPladebeskrivelse
});
for (const felt of document.querySelectorAll('[name="klimasystem"]')) {
  felt.addEventListener('change', () => { if (felt.checked) klimalaget.skift(felt.value); });
}

// Jordskælv og vulkaner: punktlag, som først hentes, når de slås til.
const skaelvknap = document.querySelector('#skaelvlag');
const vulkanknap = document.querySelector('#vulkanlag');
let skaelvmodul;
const skaelvlaget = lavLag({
  knap: skaelvknap, signatur: document.querySelector('#skaelvsignatur'), klasse: 'skaelvlag',
  fejltekst: 'Jordskælvene kunne ikke indlæses. Globussen og de andre lag virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(vis) {
    skaelvmodul ??= await import('./jordskaelv.js');
    await globus.visTemalag('jordskaelv', vis ? skaelvmodul : null);
  },
  efter: opdaterPladebeskrivelse
});
const vulkanlaget = lavLag({
  knap: vulkanknap, signatur: document.querySelector('#vulkansignatur'), klasse: 'vulkanlag',
  fejltekst: 'Vulkanerne kunne ikke indlæses. Globussen og de andre lag virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(vis) {
    const modul = await import('./vulkaner.js');
    await globus.visTemalag('vulkaner', vis ? modul : null);
  },
  efter: opdaterPladebeskrivelse
});
// Havbundens alder: raster under landene og en profil, eleven kan måle på.
const havbundknap = document.querySelector('#havbundlag');
let havbundmodul, havbundsprofil;
const havbundlaget = lavLag({
  knap: havbundknap, signatur: document.querySelector('#havbundsignatur'), klasse: 'havbundlag',
  fejltekst: 'Havbundens alder kunne ikke indlæses. Globussen og de andre lag virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(vis) {
    havbundmodul ??= await import('./havbundsalder.js');
    if (vis && nedboerlaget.aktiv) await nedboerlaget.skift(null);
    if (!vis) havbundsprofil?.sluk();
    await globus.visTemalag('havbund', vis ? havbundmodul : null);
    if (vis && !havbundsprofil) {
      const { startProfil } = await import('./havbundsprofil.js');
      havbundsprofil = startProfil({ globus, modul: havbundmodul, opdateret: opdaterPladebeskrivelse });
    }
  },
  efter: opdaterPladebeskrivelse
});
// Nedbør måned for måned: raster over hav og land med månedsskyder og afspilning.
// Det dækker både havbund, klimazoner og temakort, så kun ét af dem vises ad gangen.
const nedboerknap = document.querySelector('#nedboerlag');
let nedboermodul, nedboerstyring;
const nedboerlaget = lavLag({
  knap: nedboerknap, signatur: document.querySelector('#nedboersignatur'), klasse: 'nedboerlag',
  fejltekst: 'Nedbørsdata kunne ikke indlæses. Globussen og de andre lag virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(vis) {
    nedboermodul ??= await import('./nedboer.js');
    if (vis) {
      await nedboermodul.hent();
      for (const lag of [havbundlaget, klimalaget, temalaget]) if (lag.aktiv) await lag.skift(null);
    } else nedboerstyring?.stop();
    await globus.visTemalag('nedboer', vis ? nedboermodul : null);
    if (vis && !nedboerstyring) {
      const { startNedboer } = await import('./nedboerstyring.js');
      nedboerstyring = startNedboer({ globus, modul: nedboermodul, opdateret: opdaterPladebeskrivelse });
    }
  },
  efter: opdaterPladebeskrivelse
});
// Signaturens valg ændrer kun tegningen; data er allerede hentet.
for (const felt of document.querySelectorAll('[name="skaelvmin"], [name="skaelvdybde"]')) {
  felt.addEventListener('change', () => {
    if (!skaelvmodul) return;
    skaelvmodul.valg.minM = Number(document.querySelector('[name="skaelvmin"]:checked').value);
    skaelvmodul.valg.dybder = new Set([...document.querySelectorAll('[name="skaelvdybde"]:checked')].map(f => f.value));
    globus.gentegn();
    opdaterPladebeskrivelse();
  });
}
// Temakort: landene farvet efter et nøgletal (temakort.js, samme data som Demografi).
const temaknap = document.querySelector('#temalag');
const temasignatur = document.querySelector('#temasignatur');
const temavalg = document.querySelector('#temaindikator');
let temamodul;
function tegnTemasignatur() {
  const m = temamodul;
  if (!temavalg.options.length) {
    for (const [emne, liste] of m.EMNER) {
      const gruppe = document.createElement('optgroup');
      gruppe.label = emne;
      for (const ind of liste) gruppe.append(new Option(ind.navn, ind.id));
      temavalg.append(gruppe);
    }
  }
  temavalg.value = m.valg.id;
  const ind = m.indikator();
  const aar = m.aarFor(ind);
  const aarvalg = document.querySelector('#temaaar');
  aarvalg.hidden = !ind.aar;
  if (ind.aar && !aarvalg.childElementCount) {
    for (const a of ind.aar) {
      const label = element('label');
      const felt = document.createElement('input');
      felt.type = 'radio'; felt.name = 'temaaar'; felt.value = a;
      felt.onchange = () => { m.valg.aar = a; tegnTemasignatur(); globus.gentegn(); opdaterPladebeskrivelse(); };
      label.append(felt, a > 2023 ? `${a}*` : String(a));
      if (a > 2023) label.title = 'Fremskrivning (FN’s mellemvariant)';
      aarvalg.append(label);
    }
  }
  for (const felt of aarvalg.querySelectorAll('input')) felt.checked = Number(felt.value) === m.valg.aar;
  // Året og enheden står altid; forklaringen skjules på lave skærme.
  const kort = element('b', `${aar}${m.fremskrivning(ind) ? '* fremskrivning' : ''}${ind.enhed ? ` · ${ind.enhed}` : ''}`);
  const lang = element('span', ` – ${ind.forklaring}.`, 'temalang');
  document.querySelector('#temaforklaring').replaceChildren(kort, lang);
  const antal = m.optaelling(ind);
  const maks = Math.max(...antal, 1);
  const raekker = m.klasser(ind).map(({ farve, tekst }, i) => {
    const li = element('li');
    const felt = element('i'); felt.style.background = farve;
    const soejle = element('span', '', 'temasoejle'); soejle.style.width = `${Math.round(40 * antal[i] / maks)}px`;
    li.append(felt, element('span', tekst, 'temaklasse'), soejle, element('small', `${antal[i]}`));
    li.setAttribute('aria-label', `${tekst}: ${antal[i]} lande`);
    return li;
  });
  const ingen = element('li', '', 'ingen');
  const felt = element('i'); felt.style.background = m.INGEN_DATA;
  ingen.append(felt, element('span', 'ingen data', 'temaklasse'));
  document.querySelector('#temaklasser').replaceChildren(...raekker, ingen);
}
const temalaget = lavLag({
  knap: temaknap, signatur: temasignatur, klasse: 'temalag',
  fejltekst: 'Landedata kunne ikke indlæses. Globussen og de andre lag virker stadig. Prøv igen, eller genindlæs siden.',
  async vis(vis) {
    if (vis && klimalaget.aktiv) await klimalaget.skift(null);
    if (vis && nedboerlaget.aktiv) await nedboerlaget.skift(null);
    temamodul ??= await import('./temakort.js');
    await globus.visTemakort(vis ? temamodul : null);
    if (vis) tegnTemasignatur();
  },
  efter: opdaterPladebeskrivelse
});
temavalg.addEventListener('change', () => {
  temamodul.valg.id = temavalg.value;
  tegnTemasignatur();
  globus.gentegn();
  opdaterPladebeskrivelse();
});

lagmenu = startLagmenu({
  async hentTema() { temamodul ??= await import('./temakort.js'); return temamodul.EMNER; },
  temaId: () => temamodul?.valg.id,
  temaNavn: () => temamodul?.indikator().navn || 'Landenes nøgletal',
  klimasystem: () => klimasystem,
  async skiftTema(id) {
    if (!globus || temaknap.disabled) return;
    temamodul.valg.id = id;
    if (!temalaget.aktiv) await temalaget.skift(true);
    else { tegnTemasignatur(); globus.gentegn(); opdaterPladebeskrivelse(); }
  },
  async skiftKlima(system) { if (globus && !klimaknap.disabled) await klimalaget.skift(system); }
});

const TEMAKILDE = 'Alle tal er de samme som i landemenuens Demografi-fane. Befolkningstæthed, tilvækst, fødsels- og dødsrate, fertilitet, spædbørns- og børnedødelighed, middellevetid, medianalder, migration og aldersfordeling: United Nations, Department of Economic and Social Affairs, Population Division (2024), World Population Prospects 2024, mellemvarianten, CC BY 3.0 IGO. Tal til og med 2023 er estimater; 2050 og 2100 er fremskrivninger, som bygger på antagelser om fertilitet, dødelighed og migration. Fødsels- og dødsrate for 1950, 1980, 2000, 2050 og 2100 er FN’s femårsgennemsnit omkring året. Naturlig tilvækst er fødselsrate minus dødsrate. Andel 0–14 og 65+ år er regnet ud fra befolkningen fordelt på alder. ' +
  'HDI, BNI pr. indbygger (købekraftskorrigeret i 2021-dollar) og gennemsnitlig skolegang: UNDP, Human Development Report 2025 (data for 2023). HDI-grupperne er UNDP’s egne. Byandel: Verdensbanken, World Development Indicators (SP.URB.TOTL.IN.ZS, 2023); landenes definition af »by« er forskellig. ' +
  'Kortet: Natural Earth via world-atlas. Nordcypern og Somaliland vises med FN’s tal for hele Cypern og Somalia. Grænser og navne er ikke en stillingtagen til omstridte områder. Farver: ColorBrewer (YlOrRd og PuOr). Klassegrænserne er valgt som runde tal og, hvor det giver mening, faglige grænser (fertilitet 2,1, UNDP’s HDI-grupper, 0).';

async function visTemaopgave() {
  aabn('Undersøg landene på temakort');
  const tilbage = element('button', '← Processer', 'tilbage');
  tilbage.onclick = visProcesser;
  indhold.append(tilbage);
  indhold.append(element('p', 'Åbn Lag → Demografi og levevilkår, og vælg et nøgletal. Hvert land får én farve efter sin værdi; tallene ved farverne er antal lande i klassen. Aflæsningen viser landet ved musen eller midt på globussen. Tryk på et land for hele demografien.'));
  indhold.append(element('h3', 'Undersøg', 'underoverskrift'));
  const liste = element('ol', '', 'opgaveliste');
  for (const spoergsmaal of [
    'Vælg Samlet fertilitet. Beskriv det globale mønster: Hvor får kvinder i gennemsnit over fire børn, og hvor ligger fertiliteten under erstatningsniveauet 2,1?',
    'Sammenlign kortene for fertilitet, spædbørnsdødelighed og andel 0–14 år. Hvilke ligner hinanden – og hvorfor hænger de sammen?',
    'Vælg Fødselsrate og derefter Dødsrate, og skift mellem 1950, 1980, 2000 og 2023. Hvordan flytter mønstret sig? Placér nogle lande i den demografiske transitionsmodel.',
    'Vælg Naturlig tilvækst og Andel 65+ år for 2100*. Hvor forventer FN, at der dør flere, end der fødes? Hvad bygger en fremskrivning på, og hvor sikker er den?',
    'Sammenlign HDI, BNI pr. indbygger og Skolegang. Find et land, der ligger højere på det ene kort end på det andet. Hvad kan forklare forskellen?',
    'Vælg Nettomigration og Befolkningstilvækst. Find lande, hvor befolkningen vokser, selvom den naturlige tilvækst er lav – eller omvendt.',
    'Kortkritik: Hvert land har kun én farve, selvom forskellene inde i landet kan være store. Hvordan påvirker klassegrænserne og landenes areal dit indtryk? Hvorfor er der ikke et kort over befolkningstal (antal indbyggere)?'
  ]) liste.append(element('li', spoergsmaal));
  indhold.append(liste);
  if (globus && !temalaget.aktiv) {
    const vis = element('button', 'Slå temakortet til', 'tilbage');
    vis.onclick = async () => { senesteFokus = temaknap; dialog.close(); await temalaget.slaaTil(); };
    indhold.append(vis);
  }
  const rang = element('div');
  indhold.append(element('h3', 'Rangliste', 'underoverskrift'), rang);
  rang.append(element('p', 'Henter data …', 'antal'));
  try {
    temamodul ??= await import('./temakort.js');
    await temamodul.hent();
    const m = temamodul;
    const ind = m.indikator();
    const aar = m.aarFor(ind);
    const raekker = m.rangering(ind);
    const tabel = (fra, til) => {
      const t = element('table', '', 'rangtabel');
      t.innerHTML = '<thead><tr><th scope="col">Nr.</th><th scope="col">Land</th><th scope="col"></th></tr></thead>';
      t.querySelector('th:last-child').textContent = ind.enhed ? ind.enhed : 'Værdi';
      const krop = element('tbody');
      for (const [i, r] of raekker.slice(fra, til).entries()) {
        const tr = element('tr');
        const land = element('button', r.navn, 'tekstknap');
        land.onclick = () => visLandedata({ id: r.id, navn: r.navn }, 'demografi');
        const celle = element('td'); celle.append(land);
        tr.append(element('td', String(fra + i + 1)), celle, element('td', m.vaerditekst({ ...ind, enhed: '' }, r.v)));
        krop.append(tr);
      }
      t.append(krop);
      return t;
    };
    rang.replaceChildren(element('p', `${ind.navn} ${aar}${m.fremskrivning(ind) ? '* (fremskrivning)' : ''} – ${ind.forklaring}. ${raekker.length} lande og områder med data. Skift nøgletal eller år i signaturen, og åbn ranglisten igen.`));
    const par = element('div', '', 'rangpar');
    const top = element('div'); top.append(element('h4', 'Højeste 10'), tabel(0, 10));
    const bund = element('div'); bund.append(element('h4', 'Laveste 10'), tabel(Math.max(0, raekker.length - 10), raekker.length));
    par.append(top, bund);
    const alle = element('details', '', 'pladeoversigt');
    alle.append(element('summary', `Alle ${raekker.length}`), tabel(0, raekker.length));
    rang.append(par, alle);
  } catch {
    rang.replaceChildren(element('p', 'Landedata kunne ikke hentes. Spørgsmålene kan stadig bruges. Prøv igen senere.'));
  }
  indhold.append(lavInformation({
    navn: 'Temakort', overskrift: 'Om data',
    introduktion: 'FN’s befolkningsestimater og -fremskrivninger (WPP 2024), UNDP (HDR 2025) og Verdensbanken. Nøgletal for 2023.',
    tekst: TEMAKILDE
  }));
  const kilder = element('p', '', 'metadata');
  kilder.append('Kilder: ');
  for (const [navn, url] of [
    ['FN, World Population Prospects 2024', 'https://population.un.org/wpp/'],
    ['UNDP, Human Development Report', 'https://hdr.undp.org/data-center/documentation-and-downloads'],
    ['Verdensbanken, byandel', 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS'],
    ['ColorBrewer', 'https://colorbrewer2.org/']
  ]) {
    if (kilder.childElementCount) kilder.append(' · ');
    const link = element('a', navn);
    link.href = url;
    kilder.append(link);
  }
  indhold.append(kilder);
}
document.querySelector('#temaopgave').onclick = visTemaopgave;

document.querySelector('#skaelvopgave').onclick = visSeismikopgave;
document.querySelector('#vulkanopgave').onclick = visSeismikopgave;
document.querySelector('#klimaopgave').onclick = visKlimaopgave;
document.querySelector('#pladeopgave').onclick = visPladeopgave;
document.querySelector('#havbundopgave').onclick = visHavbundsopgave;
document.querySelector('#nedboeropgave').onclick = visNedboersopgave;

const globusknapper = [...document.querySelectorAll('[data-drej], #zoom-ind, #zoom-ud, #nulstil')];
globusknapper.forEach(knap => { knap.disabled = true; });
try {
  const { startGlobus } = await import('./globus.js');
  globus = await startGlobus(steder, visSted, vaelgLand);
  hentIndeks().then(navne => { globus.landenavne = navne; }).catch(() => {});
  globusknapper.forEach(knap => { knap.disabled = false; });
  for (const knap of document.querySelectorAll('.lagknap')) knap.disabled = false;
  // Quizmenuen kan allerede være åbnet, mens grundkortet blev hentet.
  const quizstart = document.querySelector('#quiz-start');
  if (quizstart) {
    quizstart.disabled = false;
    document.querySelector('#quiz-status').textContent = '';
  }
  // /atlas/#island drejer globussen hen til stedet, fx ved retur fra et tværsnit.
  const startsted = steder.find(sted => `#${sted.id}` === location.hash);
  if (startsted) globus.visSted(startsted);
  document.querySelector('#kortstatus').hidden = true;
} catch {
  document.querySelector('#globus').hidden = true;
  document.querySelector('.globusnote').hidden = true;
  document.querySelector('.kompas').hidden = true;
  document.querySelector('#markoerer').replaceChildren();
  const status = document.querySelector('#kortstatus');
  status.textContent = 'Globussen kunne ikke vises. Alle simulationer er stadig tilgængelige via Steder, Processer og Søg ovenfor. Genindlæs siden for at prøve igen.';
}
