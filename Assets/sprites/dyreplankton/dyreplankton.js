/**
 * Dyreplankton — dafnien Daphnia longispina — sprite til 2D-animationer.
 *
 *   import {indlaesDyreplankton} from '/Assets/sprites/dyreplankton/dyreplankton.js';
 *   const dyreplankton = await indlaesDyreplankton();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesDyreplankton() {
  return indlaesSprite(new URL('./dyreplankton.json', import.meta.url));
}

export default indlaesDyreplankton;
