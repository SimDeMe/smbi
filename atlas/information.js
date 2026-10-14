// Fælles, ikke-modal visning af supplerende faglig information.
// Panelet følger dokumentets flow og dækker derfor ikke andre kontroller.
let aaben = null;
let nummer = 0;

export function lukInformation(gendanFokus = false) {
  if (!aaben) return;
  const { knap, panel } = aaben;
  aaben = null;
  panel.hidden = true;
  knap.setAttribute('aria-expanded', 'false');
  if (gendanFokus && knap.isConnected) knap.focus({ preventScroll: true });
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !aaben) return;
  // Første Escape lukker kun informationen; værtsdialogen bevares.
  event.preventDefault();
  event.stopPropagation();
  lukInformation(true);
});
document.addEventListener('click', event => {
  if (aaben && !event.composedPath().includes(aaben.rod)) lukInformation();
});

export function lavInformation({ navn, introduktion, note, tekst, overskrift = 'Om modellen' }) {
  const rod = document.createElement('div');
  rod.className = 'oplysning';
  const raekke = document.createElement('div');
  raekke.className = 'oplysning-raekke';
  const forklaring = document.createElement('p');
  forklaring.textContent = introduktion;
  const knap = document.createElement('button');
  knap.type = 'button';
  knap.className = 'oplysning-knap';
  knap.setAttribute('aria-label', `${overskrift}: ${navn}`);
  knap.setAttribute('title', overskrift);
  knap.setAttribute('aria-expanded', 'false');
  const ikon = document.createElement('span');
  ikon.textContent = 'ⓘ';
  ikon.setAttribute('aria-hidden', 'true');
  knap.append(ikon);

  const panel = document.createElement('section');
  panel.id = `atlas-information-${++nummer}`;
  panel.className = 'oplysning-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  knap.setAttribute('aria-controls', panel.id);
  const top = document.createElement('div');
  top.className = 'oplysning-top';
  const titel = document.createElement('h3');
  titel.id = `${panel.id}-titel`;
  titel.textContent = overskrift;
  titel.tabIndex = -1;
  panel.setAttribute('aria-labelledby', titel.id);
  const luk = document.createElement('button');
  luk.type = 'button';
  luk.className = 'oplysning-luk';
  luk.textContent = 'Luk ×';
  luk.setAttribute('aria-label', `Luk information om ${navn}`);
  luk.onclick = () => lukInformation(true);
  const indhold = document.createElement('p');
  indhold.textContent = tekst;
  top.append(titel, luk);
  panel.append(top, indhold);
  raekke.append(forklaring, knap);
  rod.append(raekke);
  if (note) {
    const begraensning = document.createElement('p');
    begraensning.className = 'oplysning-note';
    begraensning.textContent = note;
    rod.append(begraensning);
  }
  rod.append(panel);
  knap.onclick = () => {
    if (!panel.hidden) return lukInformation(true);
    lukInformation();
    aaben = { rod, knap, panel };
    panel.hidden = false;
    knap.setAttribute('aria-expanded', 'true');
    titel.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  return rod;
}
