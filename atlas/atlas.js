import { steder, modeller } from './modeller.js';
import { lavInformation, lukInformation } from './information.js';

const dialog = document.querySelector('#udforsker');
const indhold = document.querySelector('#dialogindhold');
const titel = document.querySelector('#dialogtitel');
let globus;
let senesteFokus;

function element(type, tekst, klasse) {
  const el = document.createElement(type);
  if (tekst) el.textContent = tekst;
  if (klasse) el.className = klasse;
  return el;
}

function aabn(overskrift) {
  lukInformation();
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
      senesteFokus = document.querySelector('#globus');
      dialog.close();
      globus.visSted(sted);
      document.querySelector('#globus').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(visModeller(modeller.filter(model => model.steder.includes(sted.id))));
}

function visSteder() {
  aabn('Steder');
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
  indhold.append(pladeopgave);
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

function visSoeg() {
  aabn('Søg i atlasset');
  const label = element('label', 'Sted, proces eller simulation', 'soegefelt');
  const felt = element('input');
  felt.type = 'search';
  felt.placeholder = 'Fx Island, regn eller drivhuseffekt';
  label.append(felt);
  const antal = element('p', '', 'antal');
  antal.setAttribute('role', 'status');
  const resultat = element('div');
  function soeg() {
    const ord = normaliser(felt.value).trim().split(/\s+/).filter(Boolean);
    const fund = modeller.filter(model => {
      const stedtekst = steder.filter(sted => model.steder.includes(sted.id)).map(sted => `${sted.navn} ${sted.forklaring}`).join(' ');
      const tekst = normaliser(`${model.titel} ${model.emne} ${model.niveau} ${model.beskrivelse} ${model.soegeord || ''} ${stedtekst}`);
      return ord.every(del => tekst.includes(del));
    });
    antal.textContent = `${fund.length} af ${modeller.length} simulationer`;
    resultat.replaceChildren(fund.length ? visModeller(fund) : element('p', 'Ingen resultater. Prøv et andet sted eller en proces, fx klima eller vulkan.'));
  }
  felt.addEventListener('input', soeg);
  indhold.append(label, antal, resultat);
  soeg();
  felt.focus();
}

for (const knap of document.querySelectorAll('[data-indgang]')) {
  knap.onclick = { steder: visSteder, processer: visProcesser, soeg: visSoeg }[knap.dataset.indgang];
}
document.querySelector('#luk').onclick = () => dialog.close();
dialog.addEventListener('close', () => {
  lukInformation();
  senesteFokus?.focus({ preventScroll: true });
});
document.querySelector('#fokus').onclick = event => {
  const aktiv = document.body.classList.toggle('fokus');
  event.currentTarget.setAttribute('aria-pressed', String(aktiv));
  event.currentTarget.textContent = aktiv ? 'Afslut fokus' : 'Fokus';
};
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !dialog.open && !document.querySelector('[popover]:popover-open') && document.body.classList.contains('fokus')) document.querySelector('#fokus').click();
});
document.querySelector('#hjaelp').onclick = () => {
  aabn('Sådan bruger du atlasset');
  indhold.append(element('p', 'Træk i globussen med mus eller én finger for at dreje. Zoom med to fingre, knapperne +/− eller musehjulet, når globussen har fokus.'));
  indhold.append(element('p', 'Med tastatur: Piletaster drejer globussen, også efter klik andre steder på siden. I søgefelter, dialoger og komponenter med egen piletastbetjening beholder tasterne deres normale funktion. Med fokus på globussen kan du bruge +/− til zoom og Home til at nulstille. Du kan også bruge knapperne under globussen.'));
  indhold.append(element('p', 'Alle modeller kan findes under Steder, Processer og Søg, også når en markør er på bagsiden af Jorden, eller kortet ikke kan vises. Escape lukker et kort og afslutter fokustilstand.'));
  indhold.append(lavInformation({
    navn: 'Globussen', overskrift: 'Om kortet',
    introduktion: 'Oversigtskort – ikke aktuelle vejr- eller klimadata. Pladegrænselaget er en model.',
    tekst: 'Lande og kyster: Natural Earth, forenklet til 1:110 mio. via world-atlas 2.0.2. Grænser er orientering, ikke en stillingtagen til omstridte områder. Globussen viser ikke aktuelle vejr- eller klimadata. Det valgfrie pladegrænselag bygger på Birds model PB2002 fra 2003; kilden står under Pladegrænser → Undersøg og kilde.'
  }));
};

const PLADEKILDE = 'Pladegrænser: Peter Bird (2003), An updated digital model of plate boundaries, Geochemistry Geophysics Geosystems 4(3), 1027, doi:10.1029/2001GC000252. Data er hentet fra Birds egen side (peterbird.name/oldFTP/PB2002) og er identiske med kopien i github.com/fraxen/tectonicplates, som udgives under Open Data Commons Attribution 1.0. ' +
  'Bird inddeler hvert ca. 45 km langt stykke af grænserne i syv klasser ud fra pladernes beregnede relative bevægelse. Her er de samlet i tre: konstruktiv = pladerne glider fra hinanden, i havet (spredningsryg) eller på land (riftzone); destruktiv = pladerne bevæger sig mod hinanden, enten så den ene glider ned under den anden (subduktion) eller så de presses sammen til bjerge (kollision, fx Himalaya); bevarende = pladerne glider forbi hinanden (transformforkastning). Derfor kan typen skifte flere gange langs den samme grænse. ' +
  'Tænderne viser, hvilken plade der ligger øverst ved subduktion, som Bird har angivet ud fra jordskælvszoner og vulkanbuer. De skraverede områder er brede zoner med fordelt deformation, fx Alperne og Tibet. Der findes ingen enkelt skarp grænse, og linjernes placering er mindre sikker. ' +
  'Grænserne er en geologisk model, ikke skarpe målte linjer, og bevægelserne er beregnet med en ældre pladebevægelsesmodel. Koordinaterne er afrundet til ca. 1 km. Pladenavne og bevægelsespile kan vælges under Visning. Hastighederne beregnes fra PB2002-rotationspolerne relativt til den valgte referenceplade; de er modelværdier, ikke aktuelle GPS-målinger. Farten varierer fra sted til sted på samme plade. Pilen angiver retning, ikke en målfast årlig vandring. Usikre pilepunkter i diffuse zoner og den hypotetiske Shetlandbevægelse vises ikke som hastighedspile. Laget viser ikke jordskælvs- eller vulkankataloger.';

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
  tabel.append(element('summary', 'Alle pladenavne og modelhastigheder'));
  const tabelindhold = element('div');
  tabel.append(tabelindhold);
  tabel.addEventListener('toggle', async () => {
    if (!tabel.open || tabelindhold.childElementCount) return;
    tabelindhold.textContent = 'Henter pladedata …';
    try {
      const modul = await import('./pladebevaegelse.js');
      const plader = await modul.hentPlader();
      const reference = plader.find(p => p.id === pladevalg.reference);
      const t = element('table', '', 'pladetabel');
      t.append(element('caption', `PB2002-model. Hastigheder relativt til ${reference.navn}. Tallene gælder ved det viste pilepunkt; plader omfatter både land og havbund.`));
      const top = element('tr');
      for (const tekst of ['Plade og pilepunkt', 'cm/år', 'Retning']) {
        const h = element('th', tekst); h.scope = 'col'; top.append(h);
      }
      const hoved = element('thead'); hoved.append(top); t.append(hoved);
      const krop = element('tbody');
      for (const p of [...plader].sort((a, b) => a.navn.localeCompare(b.navn, 'da'))) {
        const v = modul.beregnBevaegelse(p.pol, reference.pol, p.punkt);
        const raekke = element('tr');
        const navn = element('th', p.navn); navn.scope = 'row';
        const [lon, lat] = p.punkt;
        navn.append(element('small', `${Math.abs(lat).toFixed(1).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(1).replace('.', ',')}° ${lon < 0 ? 'V' : 'Ø'}`));
        raekke.append(navn, element('td', p.usikker ? '—' : modul.formaterFart(v.fart).replace(' cm/år', '')),
          element('td', p.usikker ? 'Usikker model – se kilde' : modul.formaterRetning(v.retning)));
        krop.append(raekke);
      }
      t.append(krop); tabelindhold.replaceChildren(t);
    } catch {
      tabelindhold.textContent = 'Pladedata kunne ikke hentes. De øvrige forklaringer og simulationer kan stadig bruges. Luk og åbn listen for at prøve igen.';
    }
  });
  indhold.append(tabel);
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
      senesteFokus = document.querySelector('#globus');
      dialog.close();
      if (pladeknap.getAttribute('aria-pressed') !== 'true') await skiftPladelag();
      globus.visSted(island);
      document.querySelector('#globus').focus({ preventScroll: true });
    };
    indhold.append(find);
  }
  indhold.append(element('h3', 'Undersøg processerne i en model', 'underoverskrift'));
  indhold.append(visModeller(modeller.filter(model => model.steder.includes('island'))));
}

const pladeknap = document.querySelector('#pladelag');
const signatur = document.querySelector('#signatur');
const canvas = document.querySelector('#globus');
const canvasbeskrivelse = canvas.getAttribute('aria-label');
const pladevalg = { navne: false, bevaegelse: false, reference: 'EU' };
const valgpanel = document.querySelector('#pladevalg');
const valgknap = document.querySelector('#pladevisning');
const navnefelt = document.querySelector('#pladenavne');
const pilefelt = document.querySelector('#pladepile');
const referencefelt = document.querySelector('#pladereference');
const bevaegelsesnote = document.querySelector('#bevaegelsesnote');
const valgstatus = document.querySelector('#pladevalgstatus');

function opdaterPladebeskrivelse() {
  const reference = referencefelt.selectedOptions[0].textContent;
  bevaegelsesnote.hidden = !pladevalg.bevaegelse;
  bevaegelsesnote.textContent = `Pile: retning og cm/år ved pilepunktet, relativt til ${reference}.`;
  document.querySelector('#pladereferencefelt').hidden = !pladevalg.bevaegelse;
  canvas.setAttribute('aria-label', pladeknap.getAttribute('aria-pressed') === 'true'
    ? `${canvasbeskrivelse}. Viser pladegrænser: konstruktive, destruktive og bevarende, efter Bird 2003${pladevalg.navne ? ', med pladenavne' : ''}${pladevalg.bevaegelse ? ` og bevægelsespile i cm/år relativt til ${reference}` : ''}`
    : canvasbeskrivelse);
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
  const ny = { navne: navnefelt.checked, bevaegelse: pilefelt.checked, reference: referencefelt.value };
  const havdeFokus = document.activeElement;
  for (const felt of [navnefelt, pilefelt, referencefelt]) felt.disabled = true;
  valgstatus.hidden = true;
  valgpanel.setAttribute('aria-busy', 'true');
  try {
    await globus.visPladeoplysninger(ny);
    Object.assign(pladevalg, ny);
  } catch {
    navnefelt.checked = pladevalg.navne; pilefelt.checked = pladevalg.bevaegelse; referencefelt.value = pladevalg.reference;
    valgstatus.textContent = 'Navne og bevægelser kunne ikke hentes. Pladegrænser og globus virker stadig. Prøv igen, eller genindlæs siden.';
    valgstatus.hidden = false;
  } finally {
    for (const felt of [navnefelt, pilefelt, referencefelt]) felt.disabled = false;
    valgpanel.removeAttribute('aria-busy');
    opdaterPladebeskrivelse(); placerValgpanel();
    if (document.activeElement === document.body && valgpanel.matches(':popover-open')) havdeFokus.focus({ preventScroll: true });
  }
}
for (const felt of [navnefelt, pilefelt, referencefelt]) felt.addEventListener('change', skiftPladeoplysninger);
async function skiftPladelag() {
  const vis = pladeknap.getAttribute('aria-pressed') !== 'true';
  const havdeFokus = document.activeElement === pladeknap;
  const status = document.querySelector('#kortstatus');
  pladeknap.disabled = true;
  pladeknap.setAttribute('aria-busy', 'true');
  try {
    await globus.visPladegraenser(vis);
    pladeknap.setAttribute('aria-pressed', String(vis));
    signatur.hidden = !vis;
    document.body.classList.toggle('pladelag', vis);
    if (!vis && valgpanel.matches(':popover-open')) valgpanel.hidePopover();
    opdaterPladebeskrivelse();
    status.hidden = true;
  } catch {
    status.textContent = 'Pladegrænserne kunne ikke indlæses. Globussen virker stadig. Find tekst, opgave og kilder under Processer → Undersøg pladegrænserne. Prøv igen, eller genindlæs siden, hvis problemet fortsætter.';
    status.hidden = false;
  } finally {
    pladeknap.disabled = false;
    pladeknap.removeAttribute('aria-busy');
    // Native disabled kan fjerne fokus. Giv det tilbage efter indlæsning,
    // hvis eleven ikke i mellemtiden har valgt en anden kontrol eller dialog.
    if (havdeFokus && document.activeElement === document.body && !dialog.open) pladeknap.focus({ preventScroll: true });
  }
}
pladeknap.onclick = skiftPladelag;
document.querySelector('#pladeopgave').onclick = visPladeopgave;

const globusknapper = [...document.querySelectorAll('[data-drej], #zoom-ind, #zoom-ud, #nulstil')];
globusknapper.forEach(knap => { knap.disabled = true; });
try {
  const { startGlobus } = await import('./globus.js');
  globus = await startGlobus(steder, visSted);
  globusknapper.forEach(knap => { knap.disabled = false; });
  pladeknap.disabled = false;
  document.querySelector('#kortstatus').hidden = true;
} catch {
  document.querySelector('#globus').hidden = true;
  document.querySelector('.globusnote').hidden = true;
  document.querySelector('.kompas').hidden = true;
  document.querySelector('#markoerer').replaceChildren();
  const status = document.querySelector('#kortstatus');
  status.textContent = 'Globussen kunne ikke vises. Alle simulationer er stadig tilgængelige via Steder, Processer og Søg ovenfor. Genindlæs siden for at prøve igen.';
}
