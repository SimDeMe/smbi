// Menu for et land valgt på globussen eller i søgningen.
// Navneindekset (ca. 5 kB) hentes én gang; data til fanerne hentes først,
// når en fane vælges (demografi.js og klima.js).

let indeks;
export function hentIndeks() {
  if (!indeks) {
    indeks = fetch(new URL('./data/landeindeks.json', import.meta.url), { signal: AbortSignal.timeout(12000) })
      .then(svar => { if (!svar.ok) throw new Error('Landenavne kunne ikke hentes'); return svar.json(); })
      .catch(fejl => { indeks = null; throw fejl; });
  }
  return indeks;
}

// Områder uden egen FN-kode i kortet. FN's tal dækker hele det land,
// området statistisk hører til, og det siges tydeligt i menuen.
const UDEN_KODE = {
  Kosovo: { id: '412', navn: 'Kosovo' },
  'N. Cyprus': { id: '196', navn: 'Nordcypern', note: 'FN’s tal og stationer gælder hele Cypern.' },
  Somaliland: { id: '706', navn: 'Somaliland', note: 'FN’s tal gælder hele Somalia.' }
};

// Kortobjekt → { id, navn, note }. Navnet kommer fra indekset, ellers kortets engelske navn.
export function landFraKort(feature, navne) {
  const uden = !feature.id && UDEN_KODE[feature.properties?.name];
  if (uden) return { ...uden };
  return { id: feature.id, navn: navne?.[feature.id] || feature.properties?.name || 'Ukendt område' };
}

const menu = document.createElement('div');
menu.id = 'landemenu';
menu.className = 'landemenu';
menu.popover = 'auto';
menu.setAttribute('role', 'dialog');
menu.setAttribute('aria-labelledby', 'landemenutitel');
document.body.append(menu);
let ved = null;
let efterLuk = null;

menu.addEventListener('toggle', event => {
  if (event.newState === 'closed') { const f = efterLuk; efterLuk = null; f?.(); }
});

function placer() {
  if (!menu.matches(':popover-open') || !ved) return;
  const r = menu.getBoundingClientRect();
  const smal = innerWidth < 500;
  const x = smal ? (innerWidth - r.width) / 2 : ved.x + 14;
  const y = smal ? Math.min(ved.y + 18, innerHeight - r.height - 12) : ved.y - r.height / 2;
  menu.style.left = `${Math.max(12, Math.min(innerWidth - r.width - 12, x))}px`;
  menu.style.top = `${Math.max(12, Math.min(innerHeight - r.height - 12, y))}px`;
}
window.addEventListener('resize', placer);

export function lukLandemenu() {
  if (menu.matches(':popover-open')) menu.hidePopover();
}

// valg: [{ id, titel, tekst }]; vaelg(id) kaldes efter menuen er lukket.
export function visLandemenu({ land, punkt, valg, vaelg, lukket }) {
  lukLandemenu();
  ved = punkt;
  menu.replaceChildren();
  const top = document.createElement('div');
  top.className = 'landemenu-top';
  const titel = document.createElement('h2');
  titel.id = 'landemenutitel';
  titel.textContent = land.navn;
  const luk = document.createElement('button');
  luk.type = 'button'; luk.textContent = '×'; luk.className = 'landemenu-luk';
  luk.setAttribute('aria-label', `Luk menuen for ${land.navn}`);
  luk.onclick = () => menu.hidePopover();
  top.append(titel, luk);
  menu.append(top);
  if (land.note) {
    const note = document.createElement('p');
    note.className = 'landemenu-note'; note.textContent = land.note;
    menu.append(note);
  }
  const liste = document.createElement('ul');
  for (const v of valg) {
    const li = document.createElement('li');
    const knap = document.createElement('button');
    knap.type = 'button';
    knap.dataset.valg = v.id;
    const navn = document.createElement('strong'); navn.textContent = v.titel;
    const tekst = document.createElement('span'); tekst.textContent = v.tekst;
    knap.append(navn, tekst);
    knap.onclick = () => { efterLuk = () => vaelg(v.id); menu.hidePopover(); };
    li.append(knap); liste.append(li);
  }
  menu.append(liste);
  efterLuk = lukket;
  menu.showPopover();
  placer();
  menu.querySelector('[data-valg]')?.focus({ preventScroll: true });
}
