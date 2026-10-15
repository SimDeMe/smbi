import { steder, modeller } from './modeller.js';
import { lavInformation, lukInformation } from './information.js';
import { verdensdele } from './quizmodel.js';
import { hentIndeks, landFraKort, visLandemenu, lukLandemenu } from './landemenu.js';
import { lavLag } from './lagknap.js';

const dialog = document.querySelector('#udforsker');
const indhold = document.querySelector('#dialogindhold');
const titel = document.querySelector('#dialogtitel');
let globus;
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
  for (const knap of document.querySelectorAll('.lagknap')) knap.hidden = aktiv;
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
    if (!model.steder.length) kort.append(element('p', 'Global, idealiseret model · gælder hele Jorden', 'metadata'));
    const link = element('a', 'Åbn simulation →');
    link.href = model.sti;
    link.setAttribute('aria-label', `Åbn simulation: ${model.titel}`);
    kort.append(link);
    kortliste.append(kort);
  }
  return kortliste;
}

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
  indhold.append(liste);
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
  indhold.append(pladeopgave, ' ', klimaopgave, ' ', seismikopgave);
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
  indhold.append(valg, antal, resultater);
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
  const label = element('label', 'Land, sted, proces eller simulation', 'soegefelt');
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
    antal.textContent = `${fund.length} af ${modeller.length} simulationer${lande.length ? ` · ${lande.length} ${lande.length === 1 ? 'land' : 'lande'}` : ''}`;
    resultat.replaceChildren(fund.length || lande.length ? visModeller(fund) : element('p', 'Ingen resultater. Prøv et land, et sted eller en proces, fx Kenya, klima eller vulkan.'));
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
  senesteFokus?.focus({ preventScroll: true });
});
document.querySelector('#fokus').onclick = event => {
  const aktiv = document.body.classList.toggle('fokus');
  event.currentTarget.setAttribute('aria-pressed', String(aktiv));
  event.currentTarget.textContent = aktiv ? 'Afslut fokus' : 'Fokus';
};
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  // Landemenuen er en popover og lukker selv ved Escape.
  if (document.querySelector('#landemenu:popover-open')) return;
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
  indhold.append(element('p', 'Klimazoner farver landene efter Vahls klimazoner og plantebælter eller efter Köppen – vælg i signaturen. Feltet under farverne viser klassen ved musen, eller midt på globussen ved sigtekornet, når du drejer med piletasterne. Laget kan vises sammen med pladegrænserne.'));
  indhold.append(element('p', 'Jordskælv viser skælv med magnitude 5 eller mere siden 1976, farvet efter dybde; Vulkaner viser vulkaner med udbrud inden for de seneste ca. 11 700 år. Vis dem sammen med pladegrænserne, og brug aflæsningen i signaturen til at se det enkelte skælv eller den enkelte vulkan.'));
  indhold.append(element('p', 'Danmark har også et landekort: vælg Landekort i Danmarks menu eller under Steder. På landekortet flytter træk og piletaster kortet; zoom og Nulstil virker her også. Vælg ← Globus eller Escape for at vende tilbage til din tidligere globusvisning.'));
  indhold.append(element('p', 'Med tastatur: Piletaster drejer globussen, også efter klik andre steder på siden. I søgefelter, dialoger og komponenter med egen piletastbetjening beholder tasterne deres normale funktion. Med fokus på globussen kan du bruge +/− til zoom og Home til at nulstille. Du kan også bruge knapperne under globussen.'));
  indhold.append(element('p', 'Alle modeller kan findes under Steder, Processer og Søg, også når en markør er på bagsiden af Jorden, eller kortet ikke kan vises. Escape lukker et kort og afslutter fokustilstand.'));
  indhold.append(lavInformation({
    navn: 'Globussen', overskrift: 'Om kortet',
    introduktion: 'Oversigtskort – ikke aktuelle vejr- eller klimadata. Pladegrænse- og klimalagene er modeller.',
    tekst: 'Lande og kyster: Natural Earth, forenklet til 1:110 mio. via world-atlas 2.0.2. Grænser er orientering, ikke en stillingtagen til omstridte områder. Globussen viser ikke aktuelle vejr- eller klimadata. Det valgfrie pladegrænselag bygger på Birds model PB2002 fra 2003; kilden står under Pladegrænser → Undersøg og kilde. Klimazonelaget viser klimanormaler for 1991–2020 efter Beck m.fl. (2023); se Klimazoner → Undersøg og kilde. Jordskælv er fra USGS og vulkaner fra Smithsonian GVP; se Jordskælv → Undersøg og kilde.'
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
    ['VOTW 5.4.0 (DOI)', 'https://doi.org/10.5479/si.GVP.VOTW5-2026.5.4']
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
document.querySelector('#skaelvopgave').onclick = visSeismikopgave;
document.querySelector('#vulkanopgave').onclick = visSeismikopgave;
document.querySelector('#klimaopgave').onclick = visKlimaopgave;
document.querySelector('#pladeopgave').onclick = visPladeopgave;

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
