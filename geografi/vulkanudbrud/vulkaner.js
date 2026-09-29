/* vulkaner.js — registret over vulkantyper.
   En ny type er én ny fil (vulkan-<id>.js, se kontrakten øverst i
   vulkan-strato.js) plus én linje her. Knapperne i panelets top
   bygges ud fra listen, så snart der er mere end én. */

import strato from './vulkan-strato.js';
import skjold from './vulkan-skjold.js';
import hotspot from './vulkan-hotspot.js';

export const VULKANER = [
  strato,
  skjold,
  hotspot
];
