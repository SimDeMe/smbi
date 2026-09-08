/**
 * Åkande, hvid nøkkerose — sprite til 2D-animationer.
 *
 *   import {indlaesAakande} from '/Assets/sprites/aakande/aakande.js';
 *   const aakande = await indlaesAakande();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesAakande() {
  return indlaesSprite(new URL('./aakande.json', import.meta.url));
}

export default indlaesAakande;
