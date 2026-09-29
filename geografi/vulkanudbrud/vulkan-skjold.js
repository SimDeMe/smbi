/* vulkan-skjold.js — skjoldvulkanen: tyndtflydende, gasfattigt basaltisk
   magma i en spredningszone (Island).

   Hvor pladerne glider fra hinanden, strømmer kappen op nedefra. Trykket
   falder, og ca. 70 km nede begynder en lille del af den at smelte
   (trykaflastning). Smelten er basaltisk og stiger hurtigt op gennem
   riften uden at ligge længe nok i et kammer til at blive sej.

   Fordi magmaet er tyndtflydende, kan gasboblerne smelte sammen og slippe
   ud. Udbruddet bliver roligt (effusivt): lavafontæner og lavastrømme,
   der kan flyde mange kilometer. Lag på lag af tynde lavastrømme bygger en
   lav, bred vulkan, der ligner et skjold lagt på jorden — typen har navn
   efter Skjaldbreiður på Island.

   Eksempler: Skjaldbreiður (Island), Erta Ale (Etiopien). Skjoldvulkaner
   findes også over hotspots — se vulkan-hotspot.js.

   Kontrakten står øverst i vulkan-strato.js. */

import trin from './trin-skjold.js';
import * as oversigt from './spredning.js';
import { lavUdbrud } from './udbrud-lava.js';

const BJERG = { hoejde: 0.8, radius: 285, krater: 12 };

// Skjoldet er hvælvet: fladt øverst, lidt stejlere ud mod foden
function hoejdeAndel(d){
  if (d < BJERG.krater) return 1 - 0.1 * (1 - (d / BJERG.krater) ** 2);    // krateret
  const u = (d - BJERG.krater) / (BJERG.radius - BJERG.krater);
  return u >= 1 ? 0 : 1 - Math.pow(u, 1.6);
}

function overflade(x, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  return yFod - (yFod - geo.Y_KRATER) * hoejdeAndel(Math.abs(x - geo.XC)) - geo.loeft(x);
}

function tegnBjerg(c, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  const x0 = geo.XC - BJERG.radius - 4, x1 = geo.XC + BJERG.radius + 4;
  c.save();
  c.beginPath();
  c.moveTo(x0, yFod + 2);
  for (let x = x0; x <= x1; x += 2) c.lineTo(x, overflade(x, geo));
  c.lineTo(x1, yFod + 2);
  c.closePath();
  c.fillStyle = '#4B4441';
  c.fill();
  c.clip();
  // Mange tynde lag lava, der følger overfladen
  for (let i = 1; i < 12; i++){
    c.beginPath();
    for (let x = x0; x <= x1; x += 3){
      const y = overflade(x, geo) + i * 2.6;
      if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = i % 2 ? '#6C625C' : '#322C2A';
    c.lineWidth = 1;
    c.stroke();
  }
  c.restore();
}

export default {
  id: 'skjold',
  navn: 'Skjoldvulkan',
  kort: 'Basaltisk magma · spredningszone',
  eksempler: 'Skjaldbreiður (Island), Erta Ale',
  trinTitel: 'Fra spredningszonen til lavastrømmen i syv trin',
  beskrivelse: 'Tværsnit gennem en lav, bred skjoldvulkan fra krateret og 12 km ned. Magma kommer nedefra gennem en fødegang og samles i et magmakammer. Under et udbrud stiger magmaet op gennem kanalen, gassen slipper ud i en lavafontæne, og lavastrømme løber ned ad flankerne. En stiplet linje i kanalen viser, hvor gasboblerne begynder at dannes. Træk op og ned i figuren for at flytte lupen.',
  magma: {
    navn: 'Basaltisk',
    SiO2: 49,            // vægt-% — kiselfattigt, tyndtflydende magma
    T: 1150,             // °C
    rho: 2750,           // kg/m³ — smelte med få krystaller
    vand: 1.0,           // vægt-% — islandsk basalt har typisk 0,3–1 %
    vandMin: 0.2, vandMaks: 3,
    k: 0.095,            // opløselighed: C = k·√P, P i bar
    krystaller: 0.08,
    fragmentering: null, // tyndtflydende: boblerne kan slippe ud
    flyder: 'tyndtflydende',
    farver: ['#FF7A2E', '#D23A16']
  },
  // Smelten, som den dannes i kappen under riften
  stammagma: {
    navn: 'Basaltisk',
    SiO2: 48, T: 1250, rho: 2800,
    vand: 0.5, vandMin: 0.2, vandMaks: 3,
    k: 0.095,
    krystaller: 0.03,
    fragmentering: null,
    flyder: 'tyndtflydende',
    farver: ['#FF7A2E', '#D23A16']
  },
  u0: 0.6,               // m/s — magmaets fart i bunden af kanalen
  kammer: { top: 3.6, bund: 5.4, halvbredde: 100 },
  daeklag: null,
  kilde: 'FRA KAPPEN UNDER RIFTEN, CA. 25–70 km NEDE',
  bjerg: BJERG,
  overflade, tegnBjerg,
  udbrud: lavUdbrud({ overflade, radius: BJERG.radius }),
  oversigt,
  trin
};
