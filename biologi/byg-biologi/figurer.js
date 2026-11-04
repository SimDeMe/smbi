// Fire løse figurer, der bor i hver sin «Byg figuren»-pakke:
//   blad   → Byg cellen          (fra blad til kloroplast)
//   nefron → Byg organsystemerne (lup på urinsystemet)
//   enzym  → Byg DNA og proteinsyntesen (proteinet i arbejde)
//   hormon → Byg nerver og hormoner
// Hjertet og alveolen er tegnet forfra i Byg hjertet og kredsløbet.
// byg-biologi.html sender gamle links videre til den rigtige pakke.
import { tegnedefinitioner } from './tegning.js';
import blad from './blad.js';
import nefron from './nefron.js';
import enzym from './enzym.js';
import hormon from './hormon.js';

const figurer = [blad, nefron, enzym, hormon];
const fagord = lag => lag.flatMap(trin => trin.dele);

const ordTil = (fig) => Object.fromEntries(fagord(fig.lag).map(([ord, tekst]) => [ord, { ord, tekst }]));

const byg = ({ id, navn, intro, baggrund, lag }) => {
  const dele = fagord(lag);
  return {
    id, navn, intro, graa: 'let', vb: [880, 424], boks: [255, 42], mobilBredde: 690,
    lag: lag.map(({ navn, dele }) => ({ navn, ord: dele.map(([ord]) => ord) })),
    dele: [{ ord: null, svg: tegnedefinitioner + baggrund }, ...dele.map(([ord, , , , svg]) => ({ ord, svg }))],
    pladser: dele.map(([ord, , maal, [side, y], svg]) => ({
      ord, maal, x: 440 + side * 300, y, omr: svg,
    })),
  };
};

/** Én figur klar til motoren og dens fagord: `const { figur, ord } = hent('enzym')`. */
export function hent(id) {
  const fig = figurer.find((f) => f.id === id);
  return { figur: byg(fig), ord: ordTil(fig) };
}

/** Lægger to ordlister sammen og stopper, hvis samme ord har to forklaringer. */
export function flet(a, b) {
  for (const k of Object.keys(b)) {
    if (a[k] && a[k].tekst !== b[k].tekst) throw new Error(`Ordet ${k} har to forklaringer`);
  }
  return { ...a, ...b };
}
