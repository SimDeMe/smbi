/**
 * Gedde, svømmende — sprite til 2D-animationer.
 *
 *   import {indlaesGedde} from '/Assets/sprites/gedde/gedde.js';
 *   const gedde = await indlaesGedde();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesGedde() {
  return indlaesSprite(new URL('./gedde.json', import.meta.url));
}

export default indlaesGedde;
