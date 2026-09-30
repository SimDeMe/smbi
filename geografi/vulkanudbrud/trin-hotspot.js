/* trin-hotspot.js — hotspot-vulkanens udbrud trin for trin, fra
   kappediapiren til lavastrømmen. De tre første trin foregår i oversigten
   over hotspottet (hotspot.js), resten i tværsnittet under vulkanen.
   Felterne er de samme som i trin-strato.js. */

import { X_HOT } from './hotspot.js';
import { yD } from './subduktion.js';
import strato from './vulkan-strato.js';

const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });
const hel = v => Math.round(v).toLocaleString('da-DK');
const enh = e => `<span class="enhed">${e}</span>`;

export default [
  {
    id: 'diapir', titel: 'Kappediapiren',
    visning: 'oversigt', fokus: 'diapir',
    lupe: { slags: 'kappe', x: X_HOT, y: yD(148), d: 148, rho: 3250,
            brod: 'Olivin og pyroxen. Kappediapiren er fast, men 200–300 °C varmere end kappen omkring. Derfor er den lidt lettere og stiger langsomt op — nogle centimeter om året.' },
    tekst: () => `<p>Hawaii ligger midt på Stillehavspladen, over 3 000 km fra nærmeste pladegrænse. Vulkanerne her skyldes en <b>hotspot</b>: en søjle af særlig varm kappe — en <b>kappediapir</b> — der stiger op dybt nede fra, måske helt fra grænsen til Jordens kerne.</p>`
  },
  {
    id: 'smeltning', titel: 'Kappen smelter, når trykket falder',
    visning: 'oversigt', fokus: 'smeltning',
    lupe: { slags: 'delvis', x: X_HOT, y: yD(112), d: 112 },
    tekst: c => `<p>Når kappediapiren når op under pladen, breder den sig ud. Trykket er faldet så meget, at den varme kappe begynder at smelte allerede 100–150 km nede. Det kaldes <b>trykaflastning</b>: der er ikke tilført vand som ved en subduktionszone — det er varmen og det faldende tryk, der gør det.</p>
<p>Smelten er <b>basaltisk</b>: ca. ${c.stam.SiO2} % SiO₂ og ca. ${hel(c.stam.T)} ${enh('°C')} varm.</p>`
  },
  {
    id: 'kaede', titel: 'Pladen flytter sig',
    visning: 'oversigt', fokus: 'kaede',
    lupe: { slags: 'magma', x: X_HOT, y: yD(50), d: 50 },
    tekst: () => `<p>Magmaet er lettere end kappen og baner sig vej op gennem pladen. Imens glider Stillehavspladen mod nordvest med ca. 7 cm om året, men hotspottet bliver, hvor det er. Hver vulkan bliver derfor ført væk fra sin magmakilde, går ud og synker langsomt i havet, mens en ny vokser op over hotspottet. Sådan er hele kæden af øer dannet.</p>
<p>Den stiplede ramme er det udsnit, vi zoomer ind på i næste trin.</p>`
  },
  {
    id: 'kammer', titel: 'Magmakammeret',
    visning: 'snit', lupe: { z: 3 },
    styr: { start: 'hvile', overtryk: 6, loft: 12 },
    sammenlign: c => [['Basaltisk · her', c.magma], ['Andesitisk · stratovulkan', strato.magma]],
    tekst: c => `<p>Vulkanen er ca. ${hel(c.type.bjerg.hoejde)} km størknet lava oven på havbunden (den stiplede linje). Magmaet samles i et kammer kun ${tal(c.kammer.top)}–${tal(c.kammer.bund)} km under toppen — inde i selve vulkanen og højere oppe end havbunden omkring den. Det er stadig <b>basaltisk</b> og tyndtflydende med kun ca. ${tal(c.magma.vand)} vægt-% vand.</p>
<p>Målt fra havbunden er Mauna Kea og Mauna Loa på Hawaii over 9 km høje — højere end Mount Everest.</p>`
  },
  {
    id: 'svulmer', titel: 'Vulkanen svulmer op',
    visning: 'snit', lupe: { z: 1.5 },
    styr: { start: 'hvile', overtryk: 12, gulv: 15 },
    tekst: () => `<p>Nyt magma strømmer hele tiden ind i kammeret, og vulkanen svulmer op. På Hawaii måler man med GPS, hvordan toppen hæver sig før et udbrud. Til sidst revner klippen, og magmaet finder vej op til krateret — eller ud gennem en sprække på flanken.</p>`
  },
  {
    id: 'bobler', titel: 'Gassen slipper ud',
    visning: 'snit', lupe: { z: 0.1 },
    styr: { start: 'udbrud', gulv: 15 },
    tekst: c => `<p>Der er så lidt vand i magmaet, at boblerne først dannes ca. ${tal(c.gr.zBobler)} km under krateret. Basaltisk magma er tyndtflydende, så boblerne kan vokse, smelte sammen og stige op gennem smelten. Gassen slipper ud i stedet for at blive fanget.</p>`
  },
  {
    id: 'udbrud', titel: 'Udbruddet',
    visning: 'snit', lupe: { z: 0.08 },
    styr: { start: 'udbrud', gulv: 6 },
    tekst: c => `<p>Gassen skyder ud af krateret med ca. ${hel(Math.round(c.fart(0) / 10) * 10)} ${enh('m/s')} og river lava med op i <b>lavafontæner</b>, og lavaen løber ned ad flankerne — nogle gange helt ud i havet, hvor vandet koger. Udbruddene er så rolige, at man kan gå tæt på dem. Farligst er lavastrømmene, der kan begrave huse og veje.</p>
<p>Lag på lag af tynde lavastrømme har bygget en bred, flad <b>skjoldvulkan</b>. En hotspot-vulkan er altså også en skjoldvulkan: »skjold« fortæller om formen, »hotspot« om, hvor magmaet kommer fra.</p>`
  }
];
