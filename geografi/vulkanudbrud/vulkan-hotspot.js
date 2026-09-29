/* vulkan-hotspot.js — hotspot-vulkanen: basaltisk magma fra en kappediapir
   midt på en oceanisk plade (Hawaii).

   En søjle af særlig varm, fast kappe — en kappediapir — stiger op dybt
   nede fra. Under pladen falder trykket, og ca. 100–150 km nede smelter en
   lille del af den (trykaflastning). Hotspottet ligger stille, mens pladen
   glider hen over det, så der dannes en kæde af vulkaner, der bliver ældre
   jo længere de er ført væk.

   Magmaet er basaltisk og tyndtflydende, så gassen slipper ud, og
   udbruddene er rolige: lavafontæner, lavasøer og lavastrømme, der kan
   løbe helt ud i havet. Formen er et skjold — en hotspot-vulkan er altså
   også en skjoldvulkan. Den rejser sig fra havbunden ca. 5 km nede, og
   magmakammeret ligger inde i selve vulkanen.

   Tværsnittet er Kīlauea: toppen ligger ca. 1,2 km over havet, og
   kammeret ca. 2–4 km under toppen.

   Eksempler: Kīlauea og Mauna Loa (Hawaii), Piton de la Fournaise (Réunion).

   Kontrakten står øverst i vulkan-strato.js. */

import trin from './trin-hotspot.js';
import * as oversigt from './hotspot.js';
import { lavUdbrud } from './udbrud-lava.js';

const HAV = 1.2;                                   // km under toppen
const BJERG = { hoejde: HAV + 5, radius: 300, krater: 30 };

// Hvælvet som et skjold: fladt over havet, stejlere under havet
function hoejdeAndel(d){
  if (d < BJERG.krater) return 1 - 0.035 * (d < BJERG.krater - 6 ? 1 : (BJERG.krater - d) / 6);   // kalderaen
  const u = (d - BJERG.krater) / (BJERG.radius - BJERG.krater);
  return u >= 1 ? 0 : 1 - Math.pow(u, 1.8);
}

function overflade(x, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  return yFod - (yFod - geo.Y_KRATER) * hoejdeAndel(Math.abs(x - geo.XC)) - geo.loeft(x);
}

const havY = geo => geo.yZ(HAV);

function tegnBjerg(c, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  // havet
  const hg = c.createLinearGradient(0, havY(geo), 0, yFod);
  hg.addColorStop(0, '#86C9EC'); hg.addColorStop(1, '#3D8FC0');
  c.fillStyle = hg; c.fillRect(0, havY(geo), geo.W, yFod - havY(geo) + 1);
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
  for (let i = 1; i < 22; i++){
    c.beginPath();
    for (let x = x0; x <= x1; x += 3){
      const y = overflade(x, geo) + i * 3;
      if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = i % 2 ? '#6C625C' : '#322C2A';
    c.lineWidth = 1;
    c.stroke();
  }
  c.restore();
  // havniveauet
  c.save();
  c.strokeStyle = '#0E5FA8'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, havY(geo)); c.lineTo(geo.W, havY(geo)); c.stroke();
  c.restore();
}

const udbrud = lavUdbrud({ overflade, radius: BJERG.radius, hav: havY });
// Mærkaterne for havet og havbunden står fast; udbruddets egne kommer oveni
const udbrudsMaerkater = udbrud.maerkater;
udbrud.maerkater = (geo, tilst) => [
  { tekst: 'HAVNIVEAU', x: 96, y: havY(geo) - 6 },
  { tekst: 'HAVBUND', enhed: 'ca. 5 km under havet', x: 150, y: geo.yZ(BJERG.hoejde) - 8 },
  ...udbrudsMaerkater(geo, tilst)
];

export default {
  id: 'hotspot',
  navn: 'Hotspot-vulkan',
  kort: 'Basaltisk magma · hotspot midt på en plade',
  eksempler: 'Kīlauea og Mauna Loa (Hawaii)',
  trinTitel: 'Fra kappediapiren til lavastrømmen i syv trin',
  beskrivelse: 'Tværsnit gennem en hotspot-vulkan som Kīlauea på Hawaii, fra krateret og 12 km ned. Vulkanen rejser sig fra havbunden ca. 6 km under toppen, og havniveauet ligger 1,2 km under toppen. Magma kommer nedefra gennem en fødegang og samles i et magmakammer inde i selve vulkanen. Under et udbrud slipper gassen ud i en lavafontæne, og lavastrømme løber ned ad flankerne og ud i havet. En stiplet linje i kanalen viser, hvor gasboblerne begynder at dannes. Træk op og ned i figuren for at flytte lupen.',
  magma: {
    navn: 'Basaltisk',
    SiO2: 50,            // vægt-%
    T: 1170,             // °C
    rho: 2750,           // kg/m³
    vand: 0.7,           // vægt-% — Kīlaueas magma har ca. 0,3–0,7 %
    vandMin: 0.2, vandMaks: 3,
    k: 0.095,
    krystaller: 0.06,
    fragmentering: null,
    flyder: 'tyndtflydende',
    farver: ['#FF7A2E', '#D23A16']
  },
  // Smelten i kappediapiren: varmere end andre steder
  stammagma: {
    navn: 'Basaltisk',
    SiO2: 47, T: 1350, rho: 2850,
    vand: 0.4, vandMin: 0.2, vandMaks: 3,
    k: 0.095,
    krystaller: 0.03,
    fragmentering: null,
    flyder: 'tyndtflydende',
    farver: ['#FF7A2E', '#D23A16']
  },
  u0: 0.6,
  kammer: { top: 2.0, bund: 3.8, halvbredde: 92 },
  daeklag: null,
  kilde: 'FRA KAPPEDIAPIREN, CA. 100–150 km NEDE',
  skorpe: ['#3F4B57', '#6A7378'],        // oceanisk skorpe under havbunden
  bjerg: BJERG,
  overflade, tegnBjerg,
  udbrud,
  oversigt,
  trin
};
