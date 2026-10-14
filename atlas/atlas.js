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
  if (event.key === 'Escape' && !dialog.open && document.body.classList.contains('fokus')) document.querySelector('#fokus').click();
});
document.querySelector('#hjaelp').onclick = () => {
  aabn('Sådan bruger du atlasset');
  indhold.append(element('p', 'Træk i globussen med mus eller én finger for at dreje. Zoom med to fingre, knapperne +/− eller musehjulet, når globussen har fokus.'));
  indhold.append(element('p', 'Med tastatur: Piletaster drejer globussen, også efter klik andre steder på siden. I søgefelter, dialoger og komponenter med egen piletastbetjening beholder tasterne deres normale funktion. Med fokus på globussen kan du bruge +/− til zoom og Home til at nulstille. Du kan også bruge knapperne under globussen.'));
  indhold.append(element('p', 'Alle modeller kan findes under Steder, Processer og Søg, også når en markør er på bagsiden af Jorden, eller kortet ikke kan vises. Escape lukker et kort og afslutter fokustilstand.'));
  indhold.append(lavInformation({
    navn: 'Globussen', overskrift: 'Om kortet',
    introduktion: 'Oversigtskort – ikke aktuelle vejr-, klima- eller pladedata.',
    tekst: 'Lande og kyster: Natural Earth, forenklet til 1:110 mio. via world-atlas 2.0.2. Grænser er orientering, ikke en stillingtagen til omstridte områder. Globussen viser ikke aktuelle vejr-, klima- eller pladedata.'
  }));
};

const globusknapper = [...document.querySelectorAll('[data-drej], #zoom-ind, #zoom-ud, #nulstil')];
globusknapper.forEach(knap => { knap.disabled = true; });
try {
  const { startGlobus } = await import('./globus.js');
  globus = await startGlobus(steder, visSted);
  globusknapper.forEach(knap => { knap.disabled = false; });
  document.querySelector('#kortstatus').hidden = true;
} catch {
  document.querySelector('#globus').hidden = true;
  document.querySelector('.globusnote').hidden = true;
  document.querySelector('.kompas').hidden = true;
  document.querySelector('#markoerer').replaceChildren();
  const status = document.querySelector('#kortstatus');
  status.textContent = 'Globussen kunne ikke vises. Alle simulationer er stadig tilgængelige via Steder, Processer og Søg ovenfor. Genindlæs siden for at prøve igen.';
}
