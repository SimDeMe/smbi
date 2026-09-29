/* trin-skjold.js — skjoldvulkanens udbrud trin for trin, fra spredningszonen
   til lavastrømmen. De tre første trin foregår i oversigten over
   spredningszonen (spredning.js), resten i tværsnittet under vulkanen.
   Felterne er de samme som i trin-strato.js. */

import { X_RIFT } from './spredning.js';
import { yD } from './subduktion.js';
import strato from './vulkan-strato.js';

const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });
const hel = v => Math.round(v).toLocaleString('da-DK');
const enh = e => `<span class="enhed">${e}</span>`;

export default [
  {
    id: 'plader', titel: 'Pladerne glider fra hinanden',
    visning: 'oversigt', fokus: 'plader',
    lupe: { slags: 'kappe', x: X_RIFT + 30, y: yD(112), d: 112 },
    tekst: () => `<p>Island ligger på Den Midtatlantiske Ryg, hvor Den Nordamerikanske og Den Eurasiske Plade glider fra hinanden med ca. 2 cm om året. Det kaldes en <b>spredningszone</b>. Når pladerne trækkes fra hinanden, strømmer den varme, faste kappe langsomt op nedefra og fylder hullet.</p>`
  },
  {
    id: 'smeltning', titel: 'Kappen smelter, når trykket falder',
    visning: 'oversigt', fokus: 'smeltning',
    lupe: { slags: 'delvis', x: X_RIFT, y: yD(48), d: 48 },
    tekst: c => `<p>Kappen er næsten varm nok til at smelte, men det høje tryk holder den fast. På vej op falder trykket, og ca. 70 km nede er det så lavt, at en lille del af kappen smelter. Det kaldes <b>trykaflastning</b> — der skal hverken tilføres vand eller varme.</p>
<p>Smelten er <b>basaltisk</b>: ca. ${c.stam.SiO2} % SiO₂ og ca. ${hel(c.stam.T)} ${enh('°C')} varm. Under Island ligger der desuden en hotspot, så der dannes ekstra meget magma — derfor rager Island op over havet.</p>`
  },
  {
    id: 'opstigning', titel: 'Magmaet stiger op',
    visning: 'oversigt', fokus: 'opstigning',
    lupe: { slags: 'magma', x: X_RIFT, y: yD(16), d: 16 },
    tekst: c => `<p>Smelten er lettere end kappen omkring den (${tal(c.stam.rho / 1000)} mod ${tal(c.rhoKappe / 1000)} ${enh('g/cm³')}) og stiger op gennem riften, hvor skorpen er revnet. Noget af magmaet størkner i sprækkerne som lodrette <b>gange</b>.</p>
<p>Resten samler sig nogle kilometer under overfladen. Den stiplede ramme er det udsnit, vi zoomer ind på i næste trin.</p>`
  },
  {
    id: 'kammer', titel: 'Magmakammeret',
    visning: 'snit', lupe: { z: 4.5 },
    styr: { start: 'hvile', overtryk: 6, loft: 12 },
    sammenlign: c => [['Basaltisk · her', c.magma], ['Andesitisk · stratovulkan', strato.magma]],
    tekst: c => `<p>Magmaet samles i et kammer ${tal(c.kammer.top)}–${tal(c.kammer.bund)} km nede. Det når ikke at ændre sig meget på vejen: det er stadig <b>basaltisk</b>, varmt og tyndtflydende, og det indeholder kun ca. ${tal(c.magma.vand)} vægt-% vand.</p>
<p>Skemaet sammenligner med stratovulkanens andesitiske magma.</p>`
  },
  {
    id: 'revner', titel: 'Jorden revner',
    visning: 'snit', lupe: { z: 2.5 },
    styr: { start: 'hvile', overtryk: 12, gulv: 15 },
    tekst: () => `<p>Pladerne trækker hele tiden i skorpen, og nyt magma presser på nedefra. Til sidst revner klippen, og magmaet finder vej op. I en spredningszone kommer udbruddet tit ud gennem en lang sprække; samler det sig om én åbning i lang tid, bygges der en vulkan op.</p>`
  },
  {
    id: 'bobler', titel: 'Gassen slipper ud',
    visning: 'snit', lupe: { z: 0.2 },
    styr: { start: 'udbrud', gulv: 15 },
    tekst: c => `<p>Der er så lidt vand i magmaet, at boblerne først dannes ca. ${tal(c.gr.zBobler)} km under krateret. Basaltisk magma er tyndtflydende, så boblerne kan vokse, smelte sammen og stige op gennem smelten. Gassen slipper ud i stedet for at blive fanget.</p>
<p>Magmaet bliver lettere og stiger hurtigere: fra ca. ${tal(c.fart(3))} ${enh('m/s')} 3 km nede til ca. ${tal(c.fart(0.2))} ${enh('m/s')} her.</p>`
  },
  {
    id: 'udbrud', titel: 'Udbruddet',
    visning: 'snit', lupe: { z: 0.08 },
    styr: { start: 'udbrud', gulv: 6 },
    tekst: c => `<p>Gassen skyder ud af krateret med ca. ${hel(Math.round(c.fart(0) / 10) * 10)} ${enh('m/s')} og river klumper af smelte med sig op i en <b>lavafontæne</b>. Lavaen falder ned igen og løber ud over flankerne som <b>lavastrømme</b>, der kan flyde mange kilometer, før de størkner. Der bliver ingen askesøjle.</p>
<p>Hvert udbrud lægger et nyt, tyndt lag lava ovenpå. Lag på lag bygges en lav, bred vulkan, der ligner et skjold lagt på jorden. Skjaldbreiður på Island — »det brede skjold« — har givet navn til hele typen.</p>`
  }
];
