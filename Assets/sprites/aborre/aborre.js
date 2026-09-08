/**
 * Aborre, svømmende — sprite til 2D-animationer.
 *
 *   import {indlaesAborre} from '/Assets/sprites/aborre/aborre.js';
 *   const aborre = await indlaesAborre();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesAborre() {
  return indlaesSprite(new URL('./aborre.json', import.meta.url));
}

export default indlaesAborre;
