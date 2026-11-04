// Figurerne og ordlisten i «Byg cellen». Bruges af siden og af selvtesten.
import dyr from './fig-dyr.js';
import plante from './fig-plante.js';
import bakterie from './fig-bakterie.js';
import typer from './fig-typer.js';
import mitokondrie from './fig-mitokondrie.js';
import kloroplast from './fig-kloroplast.js';
import { ORD as CELLEORD } from './ordliste.js';
import { hent, flet } from '../byg-biologi/figurer.js';

// Bladet står lige før kloroplasten: fra organ til organel.
const blad = hent('blad');
export const ORD = flet(CELLEORD, blad.ord);

export const FIGURER = [dyr, plante, bakterie, typer, mitokondrie, blad.figur, kloroplast];
export const NOEGLE = 'byg-cellen.v1';
