// Seks korte trin om havstrømmene, i samme form som cirkulationsmodellen.
// fokus: hvor globussen drejer hen; fremhaev: strømme (navne) og figurdele,
// der gløder; saet: kontakter, trinet slår til eller fra; fase: tilstanden i
// Stillehavet (FASER i model.js), ellers normal.
export const TRIN = [
  {
    titel: 'Vinden skubber havet',
    tekst: 'Passaten blæser mod vest ved ækvator, vestenvinden mod øst ved 40–50°. Vinden trækker overfladevandet med sig, så strømmene følger vindbælterne.',
    proev: 'Sammenlign de stiplede vindpile med strømmene.',
    fokus: [-35, 15], fremhaev: ['vind', 'Nordlige ækvatorialstrøm', 'Sydlige ækvatorialstrøm', 'Nordatlantiske strøm'],
    saet: { vind: true, hvirvler: false, baand: false, havtemp: false },
  },
  {
    titel: 'Kontinenterne laver hvirvler',
    tekst: 'Kontinenterne stopper strømmene og bøjer dem af. Sammen med Corioliseffekten giver det store hvirvler: med uret på den nordlige halvkugle og mod uret på den sydlige.',
    proev: 'Drej globussen, og find alle fem hvirvler.',
    fokus: [-40, 5], fremhaev: ['hvirvler'],
    saet: { vind: false, hvirvler: true, baand: false, havtemp: false },
  },
  {
    titel: 'Varme og kolde strømme',
    tekst: 'På vestsiden af oceanerne løber varmt vand fra troperne mod polen. På østsiden løber koldt vand mod ækvator – og ud for kysten stiger koldt vand op. Kolde strømme giver tørre kystørkener som Atacama og Namib.',
    proev: 'Se på havtemperaturen ud for Peru og Namibia – og ude midt i havet.',
    fokus: [-40, -20], fremhaev: ['Humboldtstrømmen', 'Benguelastrømmen', 'Brasilianske strøm'],
    saet: { vind: false, hvirvler: false, baand: false, havtemp: true },
  },
  {
    titel: 'Golfstrømmen varmer Europa',
    tekst: 'Golfstrømmen og Den Nordatlantiske Strøm fører varmt vand helt op til Norge. Derfor er Danmark meget mildere end Labrador i Canada på samme breddegrad – dér kommer en kold strøm fra nord.',
    proev: 'Slip en flaskepost ved Florida, og se hvor den ender.',
    fokus: [-30, 48], fremhaev: ['Golfstrømmen', 'Nordatlantiske strøm', 'Norske strøm', 'Labradorstrømmen'],
    saet: { vind: false, hvirvler: false, baand: false, havtemp: true },
  },
  {
    titel: 'Det store transportbånd',
    tekst: 'Ved Grønland og Antarktis bliver havvandet koldt og salt – og dermed tungt. Det synker og løber langsomt mod syd i dybet. Hele turen rundt om Jorden tager omkring 1000 år.',
    proev: 'Find de to steder, hvor vandet synker, og følg det blå dybvand.',
    fokus: [-30, 35], fremhaev: [],
    saet: { vind: false, hvirvler: false, baand: true, havtemp: false },
  },
  {
    titel: 'El Niño og La Niña',
    tekst: 'Passaten skubber normalt det varme overfladevand mod vest, mens koldt vand stiger op ud for Peru. Under El Niño svækkes passaten: det varme vand flyder mod øst og dækker det kolde, så fiskeriet svigter, Peru får regn og Australien tørke. Under La Niña er passaten ekstra stærk, og det kolde vand når længere mod vest.',
    proev: 'Skift mellem Normal, El Niño og La Niña, og aflæs temperaturen ud for Peru og ved ækvator.',
    fokus: [-130, -2], fremhaev: ['vind', 'Ækvatoriale modstrøm', 'Humboldtstrømmen'], fase: 'elnino',
    saet: { vind: true, hvirvler: false, baand: false, havtemp: true },
  },
];
