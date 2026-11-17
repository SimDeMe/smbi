// Statusprikkerne i «Byg figuren»: én prik pr. fagord (placering) eller del
// (funktionsopgaven). Grøn: rigtigt i første forsøg. Gul: efter ét forkert
// forsøg. Rød: efter to, eller svaret blev givet (×). Bruges af motor.js og
// funktion.js; udseendet står i stil.css under `.funk-prikker`.

import { lydTil, saetLyd } from './lyd.js';

const el = (tag, cls, tekst) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (tekst != null) e.textContent = tekst;
  return e;
};

/** Farven for et antal forkerte forsøg, før delen er klaret. */
export const forsoegFarve = (n) => [null, 'gul', 'roed'][Math.min(n, 2)];

/**
 * prikker: [{ farve: null|'groen'|'gul'|'roed'|'givet', klaret: bool, nu: bool, titel }]
 * Returnerer en linje med prikkerne og evt. en lydknap.
 */
export function prikRaekke(prikker, { label = '', medLyd = false } = {}) {
  const linje = el('div', 'funk-status');
  const ol = el('ol', 'funk-prikker');
  if (label) ol.setAttribute('aria-label', label);
  for (const p of prikker) {
    const farve = p.farve === 'givet' ? 'roed' : p.farve;
    const li = el('li', 'fp' + (farve ? ' ' + farve : '') + (p.nu ? ' nu' : ''),
      p.klaret ? (p.farve === 'givet' ? '×' : '✓') : '');
    li.title = p.titel;
    li.setAttribute('aria-label', p.titel);
    ol.appendChild(li);
  }
  linje.appendChild(ol);
  if (medLyd) linje.appendChild(lydKnap());
  return linje;
}

export function lydKnap() {
  const b = el('button', 'btn-mini lyd', lydTil() ? '🔊 Lyd' : '🔇 Lyd');
  b.type = 'button';
  b.setAttribute('aria-pressed', String(lydTil()));
  b.title = 'Slå lyden til eller fra';
  b.addEventListener('click', () => {
    saetLyd(!lydTil());
    b.textContent = lydTil() ? '🔊 Lyd' : '🔇 Lyd';
    b.setAttribute('aria-pressed', String(lydTil()));
  });
  return b;
}
