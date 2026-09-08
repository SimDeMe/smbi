/**
 * Planteplankton — kiselalgen Asterionella formosa — sprite til 2D-animationer.
 *
 *   import {indlaesPlanteplankton} from '/Assets/sprites/planteplankton/planteplankton.js';
 *   const planteplankton = await indlaesPlanteplankton();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesPlanteplankton() {
  return indlaesSprite(new URL('./planteplankton.json', import.meta.url));
}

export default indlaesPlanteplankton;
