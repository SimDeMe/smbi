/* ═══════════════════════════════════════════════════════════
   opskrifter.js — enkle ølopskrifter, man kan starte fra.

   Hver opskrift er hentet fra en af de store opskriftsamlinger for
   hjemmebryggere og tilpasset simuleringens udstyr: ca. 26 L urt
   før kogning, 22 L efter en times kog. Maltmængderne er skaleret,
   så simuleringen rammer opskriftens OG, og humlen, så den rammer
   IBU. «Mål» er opskriftens egne tal (eller stilens, hvor kilden
   ikke har dem), så man kan sammenligne sit eget bryg med dem.

   Alle tal kan ændres undervejs i simuleringen — opskriften er et
   udgangspunkt, ikke en facitliste.

   Felter:
     malt        kg pr. maltsort (id'erne fra MALTE i brygning.js)
     vand, vandT indmæskningsvand: liter og °C
     program     mæskeprogram, rast/tid for enkelt infusion
     skylT, urtV skyllevandets temperatur og urt til kogning (L)
     humle       [{sort, g, min}] — min er minutter FØR kogningens
                 slut, som bryggere skriver det (60 = ved kogestart)
     gaer        gærtype, gaeringT (°C) og gaerG (g tørgær)
     maal        opskriftens OG, FG, IBU og alkohol (% vol)
   ═══════════════════════════════════════════════════════════ */

export const KOGETID = 60;

export const OPSKRIFTER = [
  {
    id:'blond', navn:'Blond ale',
    /* Brewer's Friend, «Blonde Ale» (opskrift 496065): 8,5 lb pale 2-row,
       0,5 lb crystal 30L, Cascade 60/15/5 min, Safale US-05. 5 gal. */
    kilde:'Brewer’s Friend · «Blonde Ale»',
    tekst:'Lys, let og nem — en god første øl.',
    malt:{pale:4.4, kar60:0.25},
    vand:13, vandT:72, program:'infusion', rast:66, tid:60,
    skylT:77, urtV:26,
    humle:[{sort:'cascade', g:20, min:60}, {sort:'cascade', g:12, min:15}, {sort:'cascade', g:12, min:5}],
    gaer:'ale', gaeringT:18, gaerG:11.5,
    maal:{og:1.052, fg:1.011, ibu:19, abv:5.4},
  },
  {
    id:'apa', navn:'American pale ale',
    /* Brewer's Friend, «American Pale Ale» (opskrift 1161): 2-row 90,5 %,
       crystal 60L 9,5 %, Cascade 60/30/5 min, OG 1,058, 45 IBU. */
    kilde:'Brewer’s Friend · «American Pale Ale»',
    tekst:'Karamelmalt til farve og masser af Cascade.',
    malt:{pale:4.8, kar120:0.5},
    vand:15, vandT:73, program:'infusion', rast:66, tid:60,
    skylT:77, urtV:26,
    humle:[{sort:'cascade', g:40, min:60}, {sort:'cascade', g:30, min:30}, {sort:'cascade', g:35, min:5}],
    gaer:'ale', gaeringT:19, gaerG:11.5,
    maal:{og:1.058, fg:1.013, ibu:45, abv:5.9},
  },
  {
    id:'hvede', navn:'Hefeweizen',
    /* Homebrewers Association / Zymurgy, «Holier than Meow Hefeweizen»:
       2 kg pilsnermalt, 2 kg hvedemalt, 34 g Hallertau (4 %) i 60 min,
       mæsk 65 °C, OG 1,048, FG 1,010, 18 IBU. 18,9 L. */
    kilde:'Homebrewers Association · «Holier than Meow Hefeweizen»',
    tekst:'Halvt hvedemalt, lidt humle — gæren giver banan og nellike.',
    malt:{pils:2.1, hvede:2.1},
    vand:12.5, vandT:71, program:'infusion', rast:65, tid:60,
    skylT:77, urtV:26,
    humle:[{sort:'hallertauer', g:40, min:60}],
    gaer:'hvede', gaeringT:19, gaerG:11.5,
    maal:{og:1.048, fg:1.010, ibu:18, abv:4.9},
  },
  {
    id:'stout', navn:'Dry Irish stout',
    /* Brewer's Friend, «Dry Irish Stout»: 3,5 kg pale malt (Maris Otter),
       400 g bygflager, 400 g ristet byg, East Kent Goldings i 60 min,
       OG 1,042. IBU og FG efter stilen (BJCP 15B: 25–45 IBU). */
    kilde:'Brewer’s Friend · «Dry Irish Stout»',
    tekst:'Ristet byg giver den sorte farve, bygflager fylde og skum.',
    malt:{pale:3.0, flager:0.4, ristet:0.4},
    vand:12, vandT:72, program:'infusion', rast:66, tid:60,
    skylT:77, urtV:26,
    humle:[{sort:'ekg', g:60, min:60}],
    gaer:'engelsk', gaeringT:18, gaerG:11.5,
    maal:{og:1.042, fg:1.011, ibu:35, abv:4.1},
  },
  {
    id:'pilsner', navn:'Tysk pilsner',
    /* Brewer's Friend, «German Pilsner»-opskrifterne: pilsnermalt 93–97 %,
       Hallertau og Saaz, OG 1,048–1,054, 25–37 IBU, undergær (W-34/70)
       ved 10–13 °C. */
    kilde:'Brewer’s Friend · «German Pilsner»',
    tekst:'Kun pilsnermalt, tyske humler og kølig undergæring.',
    malt:{pils:4.5},
    vand:14, vandT:70, program:'trin', rast:65, tid:60,
    skylT:77, urtV:26,
    humle:[{sort:'hallertauer', g:55, min:60}, {sort:'saaz', g:30, min:20}, {sort:'saaz', g:30, min:5}],
    gaer:'lager', gaeringT:12, gaerG:23,
    maal:{og:1.050, fg:1.009, ibu:32, abv:5.2},
  },
  {
    id:'saison', navn:'Saison',
    /* BeerAdvocate, «Averagely Perfect Saison»: belgisk pilsnermalt med
       lidt hvede, Saaz, enkelt infusion ved 65 °C (150 °F), saisongær.
       OG, FG og IBU efter stilen (BJCP 25B). */
    kilde:'BeerAdvocate · «Averagely Perfect Saison»',
    tekst:'Tør og krydret — gæren arbejder varmt og gærer næsten alt.',
    malt:{pils:4.45, hvede:0.55},
    vand:15, vandT:70, program:'infusion', rast:64, tid:70,
    skylT:77, urtV:26,
    humle:[{sort:'saaz', g:65, min:60}, {sort:'saaz', g:40, min:5}],
    gaer:'saison', gaeringT:24, gaerG:11.5,
    maal:{og:1.055, fg:1.004, ibu:25, abv:6.7},
  },
];
export const opskrift = id => OPSKRIFTER.find(o => o.id === id) || null;

/** Opskriftens humleplan i minutter efter kogestart. */
export function humleplan(o){
  return o ? o.humle.map(h => ({sort:h.sort, g:h.g, tid:KOGETID - h.min})) : [];
}
