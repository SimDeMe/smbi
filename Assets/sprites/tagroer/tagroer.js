/**
 * Tagrør — sprite til 2D-animationer.
 *
 *   import {indlaesTagroer} from '/Assets/sprites/tagroer/tagroer.js';
 *   const tagroer = await indlaesTagroer();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesTagroer() {
  return indlaesSprite(new URL('./tagroer.json', import.meta.url));
}

export default indlaesTagroer;
