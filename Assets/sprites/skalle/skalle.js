/**
 * Skalle, svømmende — sprite til 2D-animationer.
 *
 *   import {indlaesSkalle} from '/Assets/sprites/skalle/skalle.js';
 *   const skalle = await indlaesSkalle();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesSkalle() {
  return indlaesSprite(new URL('./skalle.json', import.meta.url));
}

export default indlaesSkalle;
