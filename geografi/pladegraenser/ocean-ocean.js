/* ocean-ocean.js — konvergent grænse: to oceaniske plader. Den ældste og
   tungeste dykker ned under den anden, og vulkanerne bygger en bue af
   øer. Selve modellen står i subduktion.js. */

import { lavSubduktion } from './subduktion.js';

export default lavSubduktion({
  id: 'ocean-ocean',
  navn: 'Ocean mod ocean',
  oevre: 'ocean',
  kort: 'Den ældste oceaniske plade dykker ned, og der dannes en øbue',
  eksempler: 'Marianergraven, Japan og Aleuterne',
  fart: 5, haeld: 50,
  beskrivelse: 'Tværsnit gennem en subduktionszone mellem to oceaniske plader fra overfladen og 170 km ned. Den ældste plade til venstre bøjer ned i en dybhavsgrav og dykker ind under den anden. Ca. 100 km nede presses vand ud af pladen, kappen over den smelter delvis, og magmaet bygger vulkanøer op fra havbunden. Jordskælvene ligger lavt ved graven og dybere langs pladen. Træk målepunktet til siden for at aflæse, hvor dybt pladen ligger.',
  kortTekst: 'Kort set ovenfra: dybhavsgraven går lodret gennem kortet med takker, der peger ind over den øverste plade. Havbunden med magnetiske striber glider mod graven. En bue af vulkanøer ligger parallelt med graven, og jordskælvene ligger dybere, jo længere fra graven de er.',
  fakta: [
    ['Konvergent · pladerne bevæger sig mod hinanden'],
    ['Fx Marianergraven, Japan og Aleuterne']
  ]
});
