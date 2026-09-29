/* ocean-kontinent.js — konvergent grænse: en oceanisk plade dykker ned
   under et kontinent. Selve modellen står i subduktion.js. */

import { lavSubduktion } from './subduktion.js';

export default lavSubduktion({
  id: 'ocean-kontinent',
  navn: 'Ocean mod kontinent',
  oevre: 'kontinent',
  kort: 'Den tunge oceaniske plade dykker ned under kontinentet',
  eksempler: 'Andesbjergene og Cascades',
  fart: 7, haeld: 30,
  beskrivelse: 'Tværsnit gennem en subduktionszone fra overfladen og 170 km ned. Den oceaniske plade til venstre bøjer ned i en dybhavsgrav og dykker ind under et kontinent. Ca. 100 km nede presses vand ud af pladen, kappen over den smelter delvis, og magmaet stiger op til en vulkansk bjergkæde. Jordskælvene ligger lavt ved graven og dybere langs pladen. Træk målepunktet til siden for at aflæse, hvor dybt pladen ligger.',
  kortTekst: 'Kort set ovenfra: dybhavsgraven går lodret gennem kortet med takker, der peger ind over kontinentet. Den oceaniske havbund med magnetiske striber glider mod graven. En række vulkaner ligger parallelt med graven inde på kontinentet, og jordskælvene ligger dybere, jo længere fra graven de er.',
  fakta: [
    ['Konvergent · pladerne bevæger sig mod hinanden'],
    ['Fx Andesbjergene og Cascades'],
    ['Vulkaner: andesitisk magma', '../vulkanudbrud.html#type=strato&trin=1', 'Se stratovulkanen']
  ]
});
