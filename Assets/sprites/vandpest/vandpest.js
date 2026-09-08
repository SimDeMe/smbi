/**
 * Vandpest — sprite til 2D-animationer.
 *
 *   import {indlaesVandpest} from '/Assets/sprites/vandpest/vandpest.js';
 *   const vandpest = await indlaesVandpest();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesVandpest() {
  return indlaesSprite(new URL('./vandpest.json', import.meta.url));
}

export default indlaesVandpest;
