// Kildeankre til gennemskæringen. Dybder er afrundede fortolkninger af
// publikationer, ikke direkte målte kammergrænser. Form, bredde og gange er
// vores illustration. Se SNIT-KILDER.md for datumer og valg.
export const KILDER = {
  imo: { titel: 'Islands Meteorologiske Institut: Reykjanes', url: 'https://en.vedur.is/volcanoes/fagradalsfjall-eruption' },
  fag: { titel: 'Halldórsson m.fl. (2022), Nature', url: 'https://doi.org/10.1038/s41586-022-04981-x' },
  bard: { titel: 'Hudson m.fl. (2017), GRL', url: 'https://doi.org/10.1002/2017GL074749' },
  grim: { titel: 'Reverso m.fl. (2014), JGR', url: 'https://doi.org/10.1002/2013JB010569' },
  hekla: { titel: 'Ófeigsson m.fl. (2011), JGR', url: 'https://doi.org/10.1029/2010JB007576' }
};
export const SNIT = [
  {
    id: 'vatnajokull', navn: 'Vatnajökull', titel: 'Under isen gløder et andet landskab',
    ankre: [[-17.516,64.633],[-17.316,64.416]], halv: 62, bag: 46, bund: 26,
    tekst: 'Bárðarbunga og Grímsvötn ligger under Vatnajökull. Under vulkanerne samles magma i kamre på forskellige dybder, før den bevæger sig op gennem sprækker.',
    se: 'Drej blokken. Følg forbindelsen mellem Grímsvötns dybe og lave magmaområde, eller start magmaens vej.',
    kilder: ['bard','grim'],
    kamre: [
      { id:'bard', navn:'Bárðarbunga', geo:[-17.516,64.633], dybde:6.5, datum:'hav', interval:[6,7], label:'ca. 6–7 km under havet', rx:5.5, ry:.95, kilde:'bard', sikker:'Kildebaseret dybde', tekst:'Seismisk aktivitet og andre målinger støtter magmalagring omkring 6–7 km under havniveau. Kammerets form er tegnet frit.' },
      { id:'grim-lav', navn:'Grímsvötn · lavt', geo:[-17.316,64.416], dybde:3, datum:'hav', interval:[3,4], label:'ca. 3 km under havet', rx:4.3, ry:.65, kilde:'bard', sikker:'Kildebaseret dybde', tekst:'Et lavt magmaområde under Grímsvötn understøttes af seismik og deformation. Der findes flere forskellige dybdeestimater.' },
      { id:'grim-dyb', navn:'Grímsvötn · dybt', geo:[-17.316,64.416], dybde:10, datum:'hav', interval:[10,35], label:'ca. 10 km under havet', rx:5.6, ry:1.1, kilde:'grim', sikker:'Fortolket eksempel', tekst:'Et dybt og et lavt reservoir kan forklare deformationen. Her bruges artiklens eksempel med et dybt kammer ved 10 km; dybden er ikke entydigt bestemt.' }
    ],
    gange: [
      { fra:[-22,26], til:'bard', slags:'dyb' },
      { fra:'bard', til:'overflade', slags:'ud' },
      { fra:[22,26], til:'grim-dyb', slags:'dyb' },
      { fra:'grim-dyb', til:'grim-lav', slags:'mellem' },
      { fra:'grim-lav', til:'overflade', slags:'ud' }
    ]
  },
  {
    id:'reykjanes', navn:'Reykjanes', titel:'To veje op gennem halvøen',
    ankre:[[-22.43,63.88],[-22.258,63.895]], halv:37, bag:35, bund:26,
    tekst:'Under Svartsengi ligger magma relativt tæt på overfladen. Ved Fagradalsfjall kommer magmaen fra et langt dybere område. Følg de to veje op gennem halvøen.',
    se:'Start magmaen, og sammenlign, hvor langt den bevæger sig fra kamrene til overfladen.',
    kilder:['imo','fag'],
    kamre:[
      { id:'svartsengi', navn:'Svartsengi', geo:[-22.43,63.88], dybde:4.5, datum:'overflade', interval:[4,5], label:'ca. 4–5 km dybt', rx:4.4, ry:.65, kilde:'imo', sikker:'Kildebaseret dybde', tekst:'Landhævning og deformation tolkes som magmatilførsel til et bredt område omkring 4–5 km dybde. Det er en blanding af smelte, krystaller og varm sten.' },
      { id:'fagradalsfjall', navn:'Fagradalsfjall', geo:[-22.258,63.895], dybde:20, datum:'overflade', interval:[15,23], label:'ca. 20 km dybt', rx:5.4, ry:1.2, kilde:'fag', sikker:'Kildebaseret dybde', tekst:'Kemi og trykspor i materialet fra 2021 peger på lagring nær skorpe–kappe-grænsen, omtrent 20 km nede. Placeringen er forankret ved vulkanen; formen er fortolket.' }
    ],
    gange:[
      { fra:[-12,26],til:'svartsengi',slags:'dyb' },{ fra:'svartsengi',til:'overflade',slags:'ud' },
      { fra:[14,26],til:'fagradalsfjall',slags:'dyb' },{ fra:'fagradalsfjall',til:'overflade',slags:'ud' }
    ]
  },
  {
    id:'hekla', navn:'Hekla', titel:'Et dybt reservoir under Hekla',
    ankre:[[-19.866,63.983],[-19.466,63.983]], halv:37, bag:35, bund:26,
    tekst:'Heklas magma samles dybt i skorpen. Herfra stiger magma op gennem sprækker og forbindelser til vulkanen ved overfladen.',
    se:'Sammenlign Heklas dybe reservoir med de lave magmaområder i de andre snit.',
    kilder:['hekla'],
    kamre:[
      { id:'hekla',navn:'Hekla',geo:[-19.666,63.983],dybde:16,datum:'overflade',interval:[14,18],label:'ca. 14–18 km dybt',rx:6.2,ry:1.5,kilde:'hekla',sikker:'Kildebaseret dybde',tekst:'InSAR-modeller af deformationen ved udbruddet i 2000 passer med en trykkilde i ca. 14–18 km dybde. Modellen viser et illustrativt kammer omkring 16 km.' }
    ],
    gange:[{fra:[-9,26],til:'hekla',slags:'dyb'},{fra:'hekla',til:'overflade',slags:'ud'}]
  }
];
