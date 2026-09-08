/**
 * Hornblad — sprite til 2D-animationer.
 *
 *   import {indlaesHornblad} from '/Assets/sprites/hornblad/hornblad.js';
 *   const hornblad = await indlaesHornblad();
 *
 * Se Assets/sprites/README.md.
 */
import {indlaesSprite} from '../sprite.js';

export function indlaesHornblad() {
  return indlaesSprite(new URL('./hornblad.json', import.meta.url));
}

export default indlaesHornblad;
