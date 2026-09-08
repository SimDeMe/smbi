/**
 * Aborren (Perca fluviatilis) som sprite til 2D-animationer.
 *
 *   import {indlaesAborre} from '/Assets/sprites/aborre/aborre.js';
 *   const aborre = await indlaesAborre();
 *   aborre.tegn(ctx, {x, y, laengde:200, tid, retning:-1});
 *
 * Otte billeder i ét svømmetag. Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesAborre() {
  return indlaesSprite(new URL('./aborre.json', import.meta.url));
}

export default indlaesAborre;
