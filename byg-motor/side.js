// Siden bag en «Byg figuren»-side: fanerne, Svær udgave, fokus, links og tastatur.
//
//   start({ FIGURER, ORD, NOEGLE, FUNKTIONER? })   fra sidens egen figurer.js
//
// FUNKTIONER (valgfri) slår funktionsopgaven til efter hver figur:
//   { alle: { ord: tekst }, <figur-id>: { ord: tekst } }   (figurens egen tekst vinder)
//
// Snydekode til læreren: skriv «snyd» (uden for et tekstfelt), så er figuren
// bygget med det samme, og funktionsopgaven begynder. Skrives den igen under
// funktionsopgaven, er den også klaret. Intet gemmes som bygget. På mobilen:
// læg ?snyd på adressen (byg-cellen.html?snyd#dyr), så sker det på hver figur.
import { Byg } from './motor.js';

const $ = (s) => document.querySelector(s);

export function start({ FIGURER, ORD, NOEGLE, FUNKTIONER }) {

  // ── Hukommelse (kun bekvemmelighed: siden virker uden) ─────
  function hent() {
    try { return JSON.parse(localStorage.getItem(NOEGLE)) || {}; } catch (e) { return {}; }
  }
  function gem(d) {
    try { localStorage.setItem(NOEGLE, JSON.stringify(d)); } catch (e) { /* privat vindue */ }
  }
  const husk = Object.assign({ svaer: false, bygget: { let: {}, svaer: {} } }, hent());
  husk.bygget = Object.assign({ let: {}, svaer: {} }, husk.bygget);
  const udgave = () => (husk.svaer ? 'svaer' : 'let');

  const ui = {
    svg: $('#figur'),
    bakke: $('#bakke'),
    besked: $('#besked'),
    hint: $('#btn-hint'),
    indsend: $('#btn-indsend'),
    lagliste: $('#lagliste'),
    opgTitel: $('#opg-titel'),
    opgTekst: $('#opg-tekst'),
    kort: $('#faerdig-kort'),
    sr: $('#sr-status'),
  };
  const faneliste = $('#faner');
  const intro = $('#fig-intro');
  const svaerKnap = $('#svaer');

  const snydAdresse = new URLSearchParams(location.search).has('snyd');
  let motorer = {};
  let aktiv = null;

  function naesteFigur() {
    const i = FIGURER.findIndex((f) => f.id === aktiv.fig.id);
    for (let k = 1; k < FIGURER.length; k++) {   // aldrig figuren selv
      const f = FIGURER[(i + k) % FIGURER.length];
      if (!(f.id in husk.bygget[udgave()])) return f;
    }
    return null;
  }

  const hooks = {
    svaer: () => husk.svaer,
    eneFigur: () => FIGURER.length === 1,
    faerdig(fig, alleStjerner) {
      husk.bygget[udgave()][fig.id] = alleStjerner || !!husk.bygget[udgave()][fig.id];
      gem(husk);
      tegnFaner();
      konfetti();
    },
    naesteTekst() {
      const f = naesteFigur();
      return f ? `Næste figur: ${f.navn}` : null;
    },
    naeste() {
      const f = naesteFigur();
      if (f) vis(f.id, true);
    },
  };
  if (FUNKTIONER) {
    hooks.funktionTekst = (fig, ord) => (FUNKTIONER[fig.id] && FUNKTIONER[fig.id][ord]) || (FUNKTIONER.alle && FUNKTIONER.alle[ord]) || null;
    hooks.funktionFaerdig = () => konfetti();
  }

  function lavMotorer() {
    motorer = {};
    for (const f of FIGURER) motorer[f.id] = new Byg(f, ui, hooks, ORD);
  }

  function tegnFaner() {
    faneliste.innerHTML = '';
    // en side med én figur har ingen faner: figuren står for sig selv
    faneliste.hidden = FIGURER.length < 2;
    if (faneliste.hidden) return;
    FIGURER.forEach((f, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fane';
      b.setAttribute('role', 'tab');
      b.id = 'fane-' + f.id;
      b.setAttribute('aria-controls', 'scene');
      const valgt = aktiv && aktiv.fig.id === f.id;
      b.setAttribute('aria-selected', String(valgt));
      b.tabIndex = valgt ? 0 : -1;
      const bygget = husk.bygget[udgave()][f.id];
      b.innerHTML = `<span class="fnr">${i + 1}</span> <span class="fnavn"></span>`
        + (bygget === undefined ? '' : `<span class="maerke" title="${bygget ? 'Bygget uden fejl og hint' : 'Bygget'}">${bygget ? '★' : '✓'}</span>`);
      b.querySelector('.fnavn').textContent = f.navn;
      b.addEventListener('click', () => vis(f.id, true));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + FIGURER.length) % FIGURER.length;
          vis(FIGURER[n].id, true);
          $('#fane-' + FIGURER[n].id).focus();
        }
      });
      faneliste.appendChild(b);
    });
  }

  function vis(id, opdaterAdresse) {
    const m = motorer[id] || motorer[FIGURER[0].id];
    aktiv = m;
    intro.textContent = m.fig.intro;
    $('#scene').setAttribute('aria-label', 'Figur: ' + m.fig.navn);
    if (snydAdresse && !m.lagFaerdig && !m.funk) m.snyd();
    else m.tegn();
    if (!m.lagFaerdig && !ui.besked.textContent) m.besked('');
    tegnFaner();
    if (opdaterAdresse) history.replaceState(null, '', '#' + m.fig.id);
  }

  // ── Knapper ────────────────────────────────────────────────
  ui.indsend.addEventListener('click', () => aktiv.indsend());
  ui.hint.addEventListener('click', () => aktiv.hint());
  $('#btn-forfra').addEventListener('click', () => {
    aktiv.nulstil();
    aktiv.besked('Figuren bygges forfra.', 'info');
    aktiv.tegn();
  });
  svaerKnap.checked = husk.svaer;
  svaerKnap.addEventListener('change', () => {
    husk.svaer = svaerKnap.checked;
    gem(husk);
    const id = aktiv.fig.id;
    lavMotorer();
    vis(id, false);
    aktiv.besked(husk.svaer ? 'Svær udgave: alle fagord på én gang.' : 'Figuren bygges lag for lag igen.', 'info');
  });

  const fokusKnap = $('#btn-fokus');
  fokusKnap.addEventListener('click', () => {
    const til = !document.body.classList.contains('fokus');
    document.body.classList.toggle('fokus', til);
    fokusKnap.setAttribute('aria-pressed', String(til));
    fokusKnap.textContent = til ? 'Vis siden' : 'Fokus';
    if (til) $('#byg').scrollIntoView({ block: 'start' });
  });

  // ── Tastatur ───────────────────────────────────────────────
  let skrevet = '';
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const skriver = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (skriver) return;
    if (e.key.length === 1) {
      skrevet = (skrevet + e.key.toLowerCase()).slice(-4);
      if (skrevet === 'snyd') { skrevet = ''; aktiv.snyd(); return; }
    }
    if (e.key === 'Escape') { if (aktiv.annuller()) e.preventDefault(); return; }
    if (/^[1-9]$/.test(e.key) && +e.key <= FIGURER.length) { vis(FIGURER[+e.key - 1].id, true); return; }
    if (e.key === 'Enter' && (t === document.body || !t.closest('button, a, [role="button"], summary'))) {
      e.preventDefault();
      const n = $('#btn-naeste');
      if (n && !ui.kort.hidden) n.click();
      else aktiv.indsend();
    }
  });

  // ── Konfetti, når en figur er færdig ───────────────────────
  function konfetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const boks = $('#scene');
    const farver = ['#E8336D', '#FFB300', '#5FB030', '#0E86C8', '#7A4FD6', '#FF6A3D', '#0FA593'];
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('span');
      s.className = 'konfetti';
      s.style.left = Math.random() * 100 + '%';
      s.style.background = farver[i % farver.length];
      s.style.animationDelay = Math.random() * 0.35 + 's';
      s.style.setProperty('--drej', (Math.random() * 720 - 360) + 'deg');
      s.style.setProperty('--x', (Math.random() * 80 - 40) + 'px');
      boks.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  // ── Start ──────────────────────────────────────────────────
  lavMotorer();
  const fraAdresse = location.hash.slice(1);
  vis(FIGURER.some((f) => f.id === fraAdresse) ? fraAdresse : FIGURER[0].id, false);
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (motorer[id] && id !== aktiv.fig.id) vis(id, false);
  });

  // til selvtesten
  window.bygFiguren = { motorer: () => motorer, aktiv: () => aktiv, FIGURER };
}
