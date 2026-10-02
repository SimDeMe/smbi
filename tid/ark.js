// ─── Ark (bundark med baggrund) ───────────────────────────
// Arket og dets baggrund vises først, og .open sættes i næste billede, så
// CSS-overgangen kører. Ved lukning ventes til overgangen er færdig.
//
// Et åbent ark er en modal dialog: resten af appen er `inert` (kan hverken
// klikkes, tabbes til eller læses op), fokus flyttes ind i arket, Escape
// lukker det, og fokus går tilbage til den knap, der åbnede det.

const OVERGANG_MS = 280;

// Åbne ark, det øverste sidst: { id, bdId, tilbage }
const stak = [];

// Det, der skal være utilgængeligt bag et ark
const bagved = () => [document.getElementById('app'), document.getElementById('onboarding')];

function saetInert(til) {
  bagved().forEach(el => { if (el) el.inert = til; });
}

// Rolle og navn sættes første gang — markup'en har kun en <h3> i hovedet
function goerTilDialog(ark) {
  if (ark.getAttribute('role') === 'dialog') return;
  ark.setAttribute('role', 'dialog');
  ark.setAttribute('aria-modal', 'true');
  ark.tabIndex = -1;
  const titel = ark.querySelector('.sheet-head h3');
  if (titel) {
    if (!titel.id) titel.id = `${ark.id}-titel`;
    ark.setAttribute('aria-labelledby', titel.id);
  }
}

export function openSheet(id, bdId) {
  const ark = document.getElementById(id), bd = document.getElementById(bdId);
  goerTilDialog(ark);

  // Åbnes samme ark igen (fx næste trin), beholdes den oprindelige afsender
  const fandtes = stak.findIndex(a => a.id === id);
  const tilbage = fandtes >= 0 ? stak.splice(fandtes, 1)[0].tilbage : document.activeElement;
  stak.push({ id, bdId, tilbage });
  saetInert(true);
  // Andre åbne ark nedenunder skal heller ikke kunne nås
  stak.slice(0, -1).forEach(a => { document.getElementById(a.id).inert = true; });
  ark.inert = false;

  ark.classList.remove('hidden');
  bd.classList.remove('hidden');
  // Arket selv får fokus — ikke første felt, så telefonens tastatur ikke
  // springer op. Tab går derfra videre til arkets knapper og felter.
  if (!ark.contains(document.activeElement)) ark.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    ark.classList.add('open');
    bd.classList.add('open');
  });
}

export function closeSheet(id, bdId) {
  const ark = document.getElementById(id), bd = document.getElementById(bdId);
  ark.classList.remove('open');
  bd.classList.remove('open');
  setTimeout(() => {
    // Er arket åbnet igen i mellemtiden, skal det blive stående
    if (ark.classList.contains('open')) return;
    ark.classList.add('hidden');
    bd.classList.add('hidden');
  }, OVERGANG_MS);

  const i = stak.findIndex(a => a.id === id);
  if (i < 0) return;
  const [{ tilbage }] = stak.splice(i, 1);
  const oeverst = stak[stak.length - 1];
  if (oeverst) {
    document.getElementById(oeverst.id).inert = false;
  } else {
    saetInert(false);
  }
  // Fokus tilbage, hvor man kom fra — hvis det stadig findes og kan nås.
  // Ellers til det ark, der stadig er åbent.
  if (tilbage?.isConnected && !tilbage.closest('[inert]')) tilbage.focus({ preventScroll: true });
  else if (oeverst) document.getElementById(oeverst.id).focus({ preventScroll: true });
}

// Det, man kan tabbe til i et ark — synlige og ikke slået fra
const FOKUSERBAR = 'button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])';
// En radiogruppe er ét tabstop: den valgte, eller den første, hvis ingen er valgt
const erTabstop = el => {
  if (el.type !== 'radio') return true;
  if (el.checked) return true;
  const gruppe = [...document.getElementsByName(el.name)];
  return !gruppe.some(r => r.checked) && gruppe[0] === el;
};
const fokuserbare = ark => [...ark.querySelectorAll(FOKUSERBAR)]
  .filter(el => !el.disabled && el.offsetParent !== null && erTabstop(el));

// Holder Tab inde i `boks`: fra sidste til første og omvendt
export function fangTab(e, boks) {
  const el = fokuserbare(boks);
  if (!el.length) { e.preventDefault(); return; }
  const foerste = el[0], sidste = el[el.length - 1], aktiv = document.activeElement;
  if (e.shiftKey && (aktiv === foerste || aktiv === boks || !boks.contains(aktiv))) {
    e.preventDefault(); sidste.focus();
  } else if (!e.shiftKey && (aktiv === sidste || !boks.contains(aktiv))) {
    e.preventDefault(); foerste.focus();
  }
}

document.addEventListener('keydown', e => {
  if (!stak.length) return;
  const { id, bdId } = stak[stak.length - 1];

  // Escape lukker det øverste ark. Det sker gennem baggrunden, så arkets
  // egen lukkelogik kører — præcis som når man trykker ved siden af det.
  if (e.key === 'Escape') {
    e.preventDefault();
    document.getElementById(bdId)?.click();
    return;
  }

  // Tab går rundt i arket: fra sidste felt til første og omvendt. inert
  // holder appen ude, men uden det her ville fokus smutte ud i browseren.
  if (e.key === 'Tab') fangTab(e, document.getElementById(id));
});

// ─── Rækker, der åbner et ark ─────────────────────────────
// Listerækkerne er <div>'er af hensyn til layoutet. Her får de knappens
// opførsel: de kan tabbes til, læses op som knap og trykkes med Enter/mellemrum.
export function somKnap(el, fn) {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });
}
