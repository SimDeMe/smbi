// Sidens ramme: faner, fokus, dialog og højde. Hver del indlæses først, når den vises.
const dele = {
  1: () => import('./boelgetyper.js'),
  2: () => import('./lokalisering.js'),
  3: () => import('./gennemjorden.js')
};
const startet = {};
let aktiv = 0;

const faner = [...document.querySelectorAll('[role=tab]')];

// Panelets højde: resten af vinduet under fanerne, så figur og knapper ses uden at rulle.
function opdaterHoejde() {
  const del = document.querySelector('.del:not([hidden])');
  if (!del) return;
  const top = del.getBoundingClientRect().top + window.scrollY;
  document.documentElement.style.setProperty('--top', `${Math.round(top + 18)}px`);
}

async function vis(nr, fokus = false) {
  nr = Number(nr);
  if (nr === aktiv) return;
  for (const fane of faner) {
    const valgt = Number(fane.dataset.fane) === nr;
    fane.setAttribute('aria-selected', String(valgt));
    fane.tabIndex = valgt ? 0 : -1;
    document.getElementById(fane.getAttribute('aria-controls')).hidden = !valgt;
  }
  if (fokus) faner[nr - 1].focus();
  if (startet[aktiv]) startet[aktiv].skjul();
  aktiv = nr;
  history.replaceState(null, '', location.pathname + location.search + (nr === 1 ? '' : `#del-${nr}`));
  opdaterHoejde();
  if (!startet[nr]) {
    const modul = await dele[nr]();
    startet[nr] = modul.start(document.getElementById(`del-${nr}`));
  }
  if (aktiv === nr) startet[nr].vis();
}

for (const fane of faner) {
  fane.addEventListener('click', () => vis(fane.dataset.fane));
  fane.addEventListener('keydown', e => {
    const i = faner.indexOf(fane);
    const ny = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: faner.length - 1 }[e.key];
    if (ny === undefined) return;
    e.preventDefault();
    vis(faner[(ny + faner.length) % faner.length].dataset.fane, true);
  });
}

// Fokus: skjul sidehoved og intro uden browserens fuldskærm.
const fokus = document.getElementById('fokus');
fokus.addEventListener('click', () => {
  const til = !document.body.classList.contains('fokus');
  document.body.classList.toggle('fokus', til);
  fokus.setAttribute('aria-pressed', String(til));
  // Knappen skal stadig kunne nås, når introen er skjult.
  if (til) {
    const ud = document.createElement('button');
    ud.id = 'fokus-ud'; ud.className = 'lille'; ud.textContent = 'Afslut fokus';
    ud.onclick = () => fokus.click();
    document.body.append(ud);
    ud.focus();
  } else {
    document.getElementById('fokus-ud')?.remove();
    fokus.focus();
  }
  opdaterHoejde();
  window.dispatchEvent(new Event('resize'));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('fokus') && !document.querySelector('dialog[open]')) fokus.click();
});

const om = document.getElementById('om');
document.getElementById('om-knap').onclick = () => om.showModal();
document.getElementById('om-luk').onclick = () => om.close();
om.addEventListener('click', e => { if (e.target === om) om.close(); });

window.addEventListener('resize', opdaterHoejde);
document.fonts?.ready.then(opdaterHoejde);
const fraAdresse = /^#del-([123])$/.exec(location.hash);
vis(fraAdresse ? fraAdresse[1] : 1);
