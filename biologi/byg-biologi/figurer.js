import { tegnedefinitioner } from './tegning.js';
import blad from './blad.js';
import nefron from './nefron.js';
import hjerte from './hjerte.js';
import alveole from './alveole.js';
import enzym from './enzym.js';
import hormon from './hormon.js';

const figurer = [blad, nefron, hjerte, alveole, enzym, hormon];
const fagord = lag => lag.flatMap(trin => trin.dele);

export const NOEGLE = 'byg-biologi.v1';
export const ORD = Object.fromEntries(figurer.flatMap(({ lag }) =>
  fagord(lag).map(([ord, tekst]) => [ord, { ord, tekst }])));

export const FIGURER = figurer.map(({ id, navn, intro, baggrund, lag }) => {
  const dele = fagord(lag);
  return {
    id, navn, intro, graa: 'let', vb: [880, 424], boks: [255, 42], mobilBredde: 690,
    lag: lag.map(({ navn, dele }) => ({ navn, ord: dele.map(([ord]) => ord) })),
    dele: [{ ord: null, svg: tegnedefinitioner + baggrund }, ...dele.map(([ord, , , , svg]) => ({ ord, svg }))],
    pladser: dele.map(([ord, , maal, [side, y], svg]) => ({
      ord, maal, x: 440 + side * 300, y, omr: svg,
    })),
  };
});
