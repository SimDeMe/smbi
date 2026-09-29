/* trin-strato.js — stratovulkanens udbrud trin for trin, fra subduktionen
   til askesøjlen. De tre første trin foregår i oversigten over
   subduktionszonen (subduktion.js), resten i tværsnittet under vulkanen.

   Hvert trin:
     titel, tekst(ctx)   overskrift og forklaring (HTML). ctx har tal fra
                         modellen, så teksten altid passer med figuren.
     visning             'oversigt' eller 'snit'
     fokus               hvad oversigten fremhæver
     lupe                hvor lupen står: { slags, x, y, d } i oversigten
                         (x, y i px, d i km) eller { z } i tværsnittet
     styr                udbruddets forløb i trinnet:
                         start  — fasen, trinnet begynder i (udelades: fortsæt)
                         loft   — overtrykket vokser ikke over dette (MPa)
                         gulv   — overtrykket falder ikke under dette (MPa)
     sammenlign          vis skemaet over basaltisk og andesitisk magma */

import { iSkorpen, yD, X_VULKAN } from './subduktion.js';

const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });
const hel = v => Math.round(v).toLocaleString('da-DK');
const enh = e => `<span class="enhed">${e}</span>`;

// Lupens plads i oversigten: i pladens skorpe 60 km nede, i smeltezonen
// og i magmaet på vej op
const I_SKORPEN = iSkorpen(60);

export default [
  {
    id: 'plader', titel: 'Pladerne mødes',
    visning: 'oversigt', fokus: 'plader',
    lupe: { slags: 'plade', x: I_SKORPEN.x, y: I_SKORPEN.y, d: 60 },
    tekst: () => `<p>Den oceaniske plade er kold og tung og glider ned under den lettere kontinentale plade. Det kaldes <b>subduktion</b>. Pladen flytter sig kun et par centimeter om året, men den tager havbundens skorpe med sig ned — og i skorpen sidder der vand, bundet i mineralerne.</p>`
  },
  {
    id: 'smeltning', titel: 'Magmaet dannes',
    visning: 'oversigt', fokus: 'smeltning',
    lupe: { slags: 'delvis', x: X_VULKAN, y: yD(90), d: 90 },
    tekst: c => `<p>Jo dybere pladen kommer, jo varmere bliver den. Omkring 100 km nede presses vandet ud af mineralerne og siver op i <b>asthenosfæren</b> over pladen. Vandet sænker kappens smeltepunkt — ligesom salt får is til at smelte — så en lille del af kappen smelter.</p>
<p>Smelten er <b>basaltisk</b>: ca. ${c.stam.SiO2} % SiO₂ og ca. ${hel(c.stam.T)} ${enh('°C')} varm.</p>`
  },
  {
    id: 'opstigning', titel: 'Magmaet stiger op',
    visning: 'oversigt', fokus: 'opstigning',
    lupe: { slags: 'magma', x: X_VULKAN, y: yD(45), d: 45 },
    tekst: c => `<p>Smelten er lettere end den faste kappe omkring den (${tal(c.stam.rho / 1000)} mod ${tal(c.rhoKappe / 1000)} ${enh('g/cm³')}), så den presses opad mod steder, hvor trykket er lavere. Trykket er stadig så højt, at alt vandet er opløst i smelten.</p>
<p>Magmaet samler sig nogle kilometer under vulkanen. Den stiplede ramme er det udsnit, vi zoomer ind på i næste trin.</p>`
  },
  {
    id: 'kammer', titel: 'Magmakammeret',
    visning: 'snit', lupe: { z: 7.2 },
    styr: { start: 'hvile', overtryk: 6, loft: 12 },
    sammenlign: true,
    tekst: c => `<p>Magmaet standses af et tæt dæklag i skorpen og samles i et kammer ${tal(c.kammer.top, 0)}–${tal(c.kammer.bund, 0)} km nede. Her ligger det længe og køler af. De første krystaller, der dannes, er fattige på SiO₂; de synker til bunds, og samtidig smelter magmaet noget af skorpen omkring sig.</p>
<p>Tilbage bliver et <b>andesitisk</b> magma: rigere på SiO₂ og på vand — og langt sejere.</p>`
  },
  {
    id: 'revner', titel: 'Kammerets loft revner',
    visning: 'snit', lupe: { z: 4 },
    styr: { start: 'hvile', overtryk: 12, gulv: 15 },
    tekst: () => `<p>Der strømmer hele tiden nyt magma ind nedefra. Trykket i kammeret stiger, og jorden over det hæver sig en smule — det kan man måle før et udbrud.</p>
<p>Når overtrykket bliver større, end klippen kan holde til, revner loftet, og magmaet presser sig op gennem kanalen. Hold øje med lupen 4 km nede.</p>`
  },
  {
    id: 'bobler', titel: 'Gasbobler dannes',
    visning: 'snit', lupe: { z: 3 },
    styr: { start: 'udbrud', gulv: 15 },
    tekst: c => `<p>På vej op falder trykket. Ca. ${tal(c.gr.zBobler)} km under krateret er trykket så lavt, at smelten ikke længere kan holde på alt sit vand. Resten går ud af opløsning som <b>gasbobler</b> — ligesom i en sodavand, når man skruer låget af.</p>`
  },
  {
    id: 'vokser', titel: 'Boblerne vokser',
    visning: 'snit', lupe: { z: 1.5 },
    styr: { start: 'udbrud', gulv: 15 },
    tekst: c => `<p>Jo højere magmaet kommer, jo lavere er trykket, og jo mere udvider gassen sig. Magmaet bliver lettere og stiger hurtigere: fra ca. ${tal(c.fart(6))} ${enh('m/s')} i bunden af kanalen til ${tal(c.fart(1.5))} ${enh('m/s')} her.</p>
<p>Andesitisk magma er så sejt, at boblerne ikke kan slippe ud. Magmaet bliver til skum.</p>`
  },
  {
    id: 'udbrud', titel: 'Udbruddet',
    visning: 'snit', lupe: { z: 0.2 },
    styr: { start: 'udbrud', gulv: 6 },
    tekst: c => `<p>Ca. ${tal(c.gr.zFrag)} km under krateret fylder boblerne over 75 % af rumfanget, og skummet <b>sprænges</b> til gas og aske. Blandingen skyder ud af krateret med ca. ${hel(Math.round(c.fart(0) / 10) * 10)} ${enh('m/s')} og bliver til en askesøjle; større klumper kastes ud som bomber. Efterhånden tømmes kammeret, trykket falder, og udbruddet ebber ud.</p>
<p>I tyndtflydende, basaltisk magma kan gassen slippe ud undervejs. Derfor er udbruddene på Hawaii så meget roligere: lava, der flyder, i stedet for aske.</p>`
  }
];
